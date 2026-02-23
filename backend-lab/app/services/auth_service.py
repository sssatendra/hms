from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings
import structlog

logger = structlog.get_logger()

security = HTTPBearer(auto_error=False)


class JWTPayload:
    def __init__(self, data: dict):
        self.user_id: str = data.get("userId", "")
        self.tenant_id: str = data.get("tenantId", "")
        self.role: str = data.get("role", "")
        self.email: str = data.get("email", "")
        self.session_id: Optional[str] = data.get("sessionId")


def decode_jwt(token: str) -> dict:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        logger.warning("JWT decode failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> JWTPayload:
    """Extract and validate JWT from cookie or Authorization header."""
    token: Optional[str] = None

    # Check HttpOnly cookie first
    access_token_cookie = request.cookies.get("access_token")
    if access_token_cookie:
        token = access_token_cookie
    elif credentials:
        token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload_data = decode_jwt(token)

    if not payload_data.get("tenantId") or not payload_data.get("userId"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return JWTPayload(payload_data)


def require_roles(*roles: str):
    """Role-based access control dependency."""
    async def role_checker(
        current_user: JWTPayload = Depends(get_current_user),
    ) -> JWTPayload:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(roles)}",
            )
        return current_user

    return role_checker
