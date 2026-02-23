from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "HMS Lab Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    PORT: int = 8000
    
    # PostgreSQL
    POSTGRES_DSN: str = "postgresql+asyncpg://hms_user:hms_pass@localhost:5432/hms_db"
    
    # Redis
    REDIS_URL: str = "redis://:hms_redis_pass@localhost:6379"
    
    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "hms_minio_admin"
    MINIO_SECRET_KEY: str = "hms_minio_pass"
    MINIO_BUCKET_LAB: str = "hms-lab-files"
    MINIO_BUCKET_DICOM: str = "hms-dicom-files"
    MINIO_BUCKET_REPORTS: str = "hms-reports"
    MINIO_SECURE: bool = False
    MINIO_SIGNED_URL_EXPIRY: int = 3600  # seconds
    
    # JWT (shared with core service)
    JWT_SECRET: str = "super_secret_jwt_key_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    
    # File Upload
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "application/dicom",
        "image/jpeg",
        "image/png",
        "image/tiff",
        "image/dicom",
        "application/octet-stream",  # DICOM files often have this
    ]
    ALLOWED_EXTENSIONS: List[str] = [
        ".pdf", ".dcm", ".dicom", ".jpg", ".jpeg", ".png", ".tiff", ".tif"
    ]
    
    # Core service
    CORE_SERVICE_URL: str = "http://localhost:4000"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
