import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { sendError, ErrorCodes } from '../utils/response';
import { cacheGet, CacheKeys, getRedisClient } from '../services/redis';
import { logger } from '../utils/logger';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      tenantId?: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from HttpOnly cookie or Authorization header (for API clients)
    let token: string | undefined;

    if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
      return;
    }

    // Check if token is blacklisted (logged out)
    const redis = getRedisClient();
    const isBlacklisted = await redis.get(CacheKeys.blacklist(token));
    if (isBlacklisted) {
      sendError(res, ErrorCodes.INVALID_TOKEN, 'Token has been revoked', 401);
      return;
    }

    const payload = verifyAccessToken(token);

    // If MFA is pending, only allow if explicitly handled (default: reject)
    if (payload.mfa_pending) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'MFA verification required', 401);
      return;
    }

    // Validate tenant context
    if (!payload.tenantId) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid token payload', 401);
      return;
    }

    req.user = payload;
    req.tenantId = payload.tenantId;

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, ErrorCodes.TOKEN_EXPIRED, 'Token expired', 401);
    } else if (error.name === 'JsonWebTokenError') {
      sendError(res, ErrorCodes.INVALID_TOKEN, 'Invalid token', 401);
    } else {
      logger.error('Auth middleware error', { error });
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Authentication failed', 500);
    }
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];
    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
      req.tenantId = payload.tenantId;
    }
  } catch {
    // Ignore auth errors for optional auth
  }
  next();
};
