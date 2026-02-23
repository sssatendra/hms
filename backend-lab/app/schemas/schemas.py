from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SignedUrlRequest(BaseModel):
    bucket: str
    key: str
    expires_in: int = Field(default=3600, ge=60, le=86400)


class SignedUrlResponse(BaseModel):
    signed_url: str
    expires_in: int
    bucket: str
    key: str


class FileUploadResponse(BaseModel):
    success: bool
    file_id: str
    file_name: str
    original_name: str
    file_type: str
    mime_type: str
    file_size: int
    minio_bucket: str
    minio_key: str
    checksum: str
    is_dicom: bool
    dicom_metadata: Optional[Dict[str, Any]] = None
    lab_order_id: str
    tenant_id: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class DicomMetadata(BaseModel):
    patient_name: Optional[str] = None
    patient_id: Optional[str] = None
    study_date: Optional[str] = None
    study_description: Optional[str] = None
    modality: Optional[str] = None
    institution_name: Optional[str] = None
    series_description: Optional[str] = None
    rows: Optional[int] = None
    columns: Optional[int] = None
    number_of_frames: Optional[int] = None


class LabResultInput(BaseModel):
    lab_order_item_id: str
    results: List[Dict[str, Any]]
    result_notes: Optional[str] = None


class BatchSignedUrlRequest(BaseModel):
    files: List[Dict[str, str]]  # [{bucket, key}]
    expires_in: int = Field(default=3600, ge=60, le=86400)


class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[Dict[str, str]] = None
    meta: Optional[Dict[str, Any]] = None
