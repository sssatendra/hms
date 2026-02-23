import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import files
from app.services.minio_service import minio_service
from app.services.queue_service import close_redis, get_redis

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle - startup and shutdown."""
    # Startup
    logger.info("🚀 Starting HMS Lab Service...")

    try:
        # Initialize MinIO buckets
        await minio_service.initialize_all_buckets()
        logger.info("✅ MinIO initialized")

        # Initialize Redis connection
        await get_redis()
        logger.info("✅ Redis connected")

        logger.info(
            "✅ HMS Lab Service ready",
            port=settings.PORT,
            minio_endpoint=settings.MINIO_ENDPOINT,
        )
    except Exception as e:
        logger.error("❌ Startup failed", error=str(e))
        raise

    yield

    # Shutdown
    logger.info("Shutting down HMS Lab Service...")
    await close_redis()
    logger.info("✅ Graceful shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="HMS Lab Service - Handles file processing, DICOM, and MinIO storage",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# ─── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# ─── Request Logging Middleware ───────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    log = structlog.get_logger().bind(
        method=request.method,
        path=request.url.path,
    )
    try:
        response = await call_next(request)
        log.info("Request processed", status_code=response.status_code)
        return response
    except Exception as e:
        log.error("Request failed", error=str(e))
        raise


# ─── Global Exception Handler ─────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred" if not settings.DEBUG else str(exc),
            },
        },
    )


# ─── Routes ───────────────────────────────────────────────────────────────────

app.include_router(files.router, prefix="/api/v1")


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "hms-backend-lab",
        "version": settings.APP_VERSION,
    }


@app.get("/api/v1/info")
async def service_info():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "minio_endpoint": settings.MINIO_ENDPOINT,
        "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
        "allowed_extensions": settings.ALLOWED_EXTENSIONS,
    }
