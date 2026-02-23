import hashlib
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
import structlog

from app.config import settings
from app.schemas.schemas import (
    ApiResponse,
    BatchSignedUrlRequest,
    FileUploadResponse,
    SignedUrlRequest,
    SignedUrlResponse,
)
from app.services.auth_service import JWTPayload, get_current_user, require_roles
from app.services.minio_service import minio_service
from app.services.queue_service import enqueue_job

logger = structlog.get_logger()

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload/lab-report", response_model=ApiResponse)
async def upload_lab_report(
    file: UploadFile = File(...),
    lab_order_id: str = Form(...),
    current_user: JWTPayload = Depends(require_roles("ADMIN", "LAB_TECH", "DOCTOR")),
) -> ApiResponse:
    """
    Upload a lab report PDF to MinIO.
    Validates file type, size, and stores with organized key structure.
    Metadata is stored in PostgreSQL (via core service).
    """
    file_data = await file.read()

    # Validate file
    is_valid, error_msg = minio_service.validate_file(
        file_data=file_data,
        filename=file.filename or "report.pdf",
        content_type=file.content_type or "application/pdf",
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )

    try:
        # Upload to MinIO
        upload_result = await minio_service.upload_file(
            file_data=file_data,
            filename=file.filename or "report.pdf",
            content_type=file.content_type or "application/pdf",
            bucket=settings.MINIO_BUCKET_LAB,
            tenant_id=current_user.tenant_id,
            lab_order_id=lab_order_id,
        )

        # Notify core service to store file metadata in PostgreSQL
        import httpx
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{settings.CORE_SERVICE_URL}/api/v1/lab/internal/file-metadata",
                    json={
                        "lab_order_id": lab_order_id,
                        "tenant_id": current_user.tenant_id,
                        "uploaded_by": current_user.user_id,
                        **upload_result,
                    },
                    timeout=10.0,
                )
            except Exception as e:
                logger.warning("Failed to notify core service of file upload", error=str(e))
                # Continue - MinIO upload succeeded, metadata sync is best-effort

        # Queue for processing
        await enqueue_job("lab-processing", {
            "labOrderId": lab_order_id,
            "tenantId": current_user.tenant_id,
            "fileKey": upload_result["minio_key"],
            "fileType": upload_result["file_type"],
        })

        logger.info(
            "Lab report uploaded successfully",
            lab_order_id=lab_order_id,
            key=upload_result["minio_key"],
            user_id=current_user.user_id,
        )

        return ApiResponse(
            success=True,
            data={
                "lab_order_id": lab_order_id,
                "tenant_id": current_user.tenant_id,
                "uploaded_at": upload_result.get("created_at"),
                **upload_result,
            },
        )

    except RuntimeError as e:
        logger.error("Lab report upload failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}",
        )


@router.post("/upload/dicom", response_model=ApiResponse)
async def upload_dicom(
    file: UploadFile = File(...),
    lab_order_id: str = Form(...),
    current_user: JWTPayload = Depends(require_roles("ADMIN", "LAB_TECH")),
) -> ApiResponse:
    """
    Upload a DICOM image file to MinIO.
    Extracts and stores DICOM metadata.
    """
    file_data = await file.read()

    # Force DICOM content type
    content_type = "application/dicom"
    filename = file.filename or "image.dcm"

    # Basic validation
    if not filename.lower().endswith(('.dcm', '.dicom')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only DICOM files (.dcm, .dicom) are accepted at this endpoint",
        )

    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_data) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit",
        )

    # Extract DICOM metadata
    dicom_metadata = None
    try:
        import pydicom
        import io as io_module
        ds = pydicom.dcmread(io_module.BytesIO(file_data), stop_before_pixels=True, force=True)
        dicom_metadata = {
            "patient_name": str(getattr(ds, "PatientName", "")),
            "patient_id": str(getattr(ds, "PatientID", "")),
            "study_date": str(getattr(ds, "StudyDate", "")),
            "study_description": str(getattr(ds, "StudyDescription", "")),
            "modality": str(getattr(ds, "Modality", "")),
            "institution_name": str(getattr(ds, "InstitutionName", "")),
            "series_description": str(getattr(ds, "SeriesDescription", "")),
            "rows": int(getattr(ds, "Rows", 0)),
            "columns": int(getattr(ds, "Columns", 0)),
        }
    except Exception as e:
        logger.warning("Could not extract DICOM metadata", error=str(e))

    try:
        upload_result = await minio_service.upload_file(
            file_data=file_data,
            filename=filename,
            content_type=content_type,
            bucket=settings.MINIO_BUCKET_DICOM,
            tenant_id=current_user.tenant_id,
            lab_order_id=lab_order_id,
            metadata={"dicom": "true"},
        )

        return ApiResponse(
            success=True,
            data={
                **upload_result,
                "dicom_metadata": dicom_metadata,
                "lab_order_id": lab_order_id,
                "tenant_id": current_user.tenant_id,
            },
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/signed-url", response_model=ApiResponse)
async def get_signed_url(
    request: SignedUrlRequest,
    current_user: JWTPayload = Depends(get_current_user),
) -> ApiResponse:
    """
    Generate a presigned URL for secure file access.
    Used by core service and frontend for file downloads.
    All file access is via signed URLs - no public access.
    """
    # Validate the key belongs to this tenant
    expected_prefix = f"tenants/{current_user.tenant_id}/"
    if not request.key.startswith(expected_prefix):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this file",
        )

    try:
        signed_url = minio_service.generate_signed_url(
            bucket=request.bucket,
            key=request.key,
            expires_in=request.expires_in,
        )

        logger.info(
            "Signed URL generated",
            bucket=request.bucket,
            user_id=current_user.user_id,
            tenant_id=current_user.tenant_id,
        )

        return ApiResponse(
            success=True,
            data={
                "signed_url": signed_url,
                "expires_in": request.expires_in,
                "bucket": request.bucket,
                "key": request.key,
            },
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/signed-urls/batch", response_model=ApiResponse)
async def get_batch_signed_urls(
    request: BatchSignedUrlRequest,
    current_user: JWTPayload = Depends(get_current_user),
) -> ApiResponse:
    """Generate multiple signed URLs in batch."""
    expected_prefix = f"tenants/{current_user.tenant_id}/"
    results = []

    for file_ref in request.files:
        bucket = file_ref.get("bucket", "")
        key = file_ref.get("key", "")

        if not key.startswith(expected_prefix):
            results.append({"key": key, "error": "Access denied"})
            continue

        try:
            signed_url = minio_service.generate_signed_url(
                bucket=bucket,
                key=key,
                expires_in=request.expires_in,
            )
            results.append({"key": key, "signed_url": signed_url, "expires_in": request.expires_in})
        except Exception as e:
            results.append({"key": key, "error": str(e)})

    return ApiResponse(success=True, data={"urls": results})


@router.delete("/delete", response_model=ApiResponse)
async def delete_file(
    bucket: str,
    key: str,
    current_user: JWTPayload = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> ApiResponse:
    """Delete a file from MinIO (Admin only)."""
    # Validate tenant ownership
    expected_prefix = f"tenants/{current_user.tenant_id}/"
    if not key.startswith(expected_prefix):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    try:
        minio_service.delete_file(bucket=bucket, key=key)
        return ApiResponse(success=True, data={"message": "File deleted successfully"})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/list", response_model=ApiResponse)
async def list_files(
    lab_order_id: str,
    current_user: JWTPayload = Depends(get_current_user),
) -> ApiResponse:
    """List files for a specific lab order."""
    prefix = f"tenants/{current_user.tenant_id}/lab-orders/{lab_order_id}/"

    lab_files = minio_service.list_files(bucket=settings.MINIO_BUCKET_LAB, prefix=prefix)
    dicom_files = minio_service.list_files(bucket=settings.MINIO_BUCKET_DICOM, prefix=prefix)

    return ApiResponse(
        success=True,
        data={
            "lab_files": lab_files,
            "dicom_files": dicom_files,
            "total": len(lab_files) + len(dicom_files),
        },
    )
