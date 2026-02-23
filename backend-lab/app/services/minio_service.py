import hashlib
import io
import os
from datetime import timedelta
from pathlib import Path
from typing import Optional, Tuple
from uuid import uuid4

import structlog
from minio import Minio
from minio.error import S3Error

from app.config import settings

logger = structlog.get_logger()


class MinIOService:
    """MinIO S3-compatible storage service for lab files and DICOM images."""

    def __init__(self):
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self._initialized_buckets: set[str] = set()

    async def ensure_bucket(self, bucket: str) -> None:
        """Create bucket if it doesn't exist with proper policies."""
        if bucket in self._initialized_buckets:
            return

        try:
            if not self.client.bucket_exists(bucket):
                self.client.make_bucket(bucket)
                logger.info("Bucket created", bucket=bucket)

                # Set private bucket policy (no public access)
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:GetObject",
                            "Resource": f"arn:aws:s3:::{bucket}/*",
                        }
                    ],
                }
                import json
                self.client.set_bucket_policy(bucket, json.dumps(policy))

            self._initialized_buckets.add(bucket)
        except S3Error as e:
            logger.error("Failed to initialize bucket", bucket=bucket, error=str(e))
            raise

    def validate_file(
        self,
        file_data: bytes,
        filename: str,
        content_type: str,
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate file type, size, and content.
        Returns (is_valid, error_message).
        """
        # Check file size
        max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(file_data) > max_size:
            return False, f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"

        if len(file_data) == 0:
            return False, "File is empty"

        # Check extension
        ext = Path(filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            return False, f"File extension '{ext}' not allowed. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"

        # Check content type
        if content_type not in settings.ALLOWED_MIME_TYPES:
            return False, f"Content type '{content_type}' not allowed"

        # Check for DICOM magic bytes
        if ext in ('.dcm', '.dicom') or content_type in ('application/dicom', 'image/dicom'):
            # DICOM files start with 128 bytes preamble followed by "DICM"
            if len(file_data) >= 132:
                if file_data[128:132] != b'DICM':
                    # Some DICOM files don't have the preamble but are still valid
                    pass  # Allow and let downstream handle validation
            
        # Check PDF magic bytes
        if ext == '.pdf' or content_type == 'application/pdf':
            if not file_data.startswith(b'%PDF'):
                return False, "Invalid PDF file"

        return True, None

    async def upload_file(
        self,
        file_data: bytes,
        filename: str,
        content_type: str,
        bucket: str,
        tenant_id: str,
        lab_order_id: str,
        metadata: Optional[dict] = None,
    ) -> dict:
        """
        Upload file to MinIO with organized key structure.
        Returns file metadata including MinIO key and checksum.
        """
        await self.ensure_bucket(bucket)

        # Compute checksum
        checksum = hashlib.sha256(file_data).hexdigest()

        # Generate organized key
        ext = Path(filename).suffix.lower()
        file_id = str(uuid4())
        minio_key = f"tenants/{tenant_id}/lab-orders/{lab_order_id}/{file_id}{ext}"

        # Build metadata
        obj_metadata = {
            "tenant-id": tenant_id,
            "lab-order-id": lab_order_id,
            "original-filename": filename,
            "checksum-sha256": checksum,
        }
        if metadata:
            obj_metadata.update({k: str(v) for k, v in metadata.items()})

        try:
            # Upload to MinIO
            self.client.put_object(
                bucket_name=bucket,
                object_name=minio_key,
                data=io.BytesIO(file_data),
                length=len(file_data),
                content_type=content_type,
                metadata=obj_metadata,
            )

            logger.info(
                "File uploaded to MinIO",
                bucket=bucket,
                key=minio_key,
                size=len(file_data),
                tenant_id=tenant_id,
            )

            return {
                "minio_bucket": bucket,
                "minio_key": minio_key,
                "file_id": file_id,
                "file_name": f"{file_id}{ext}",
                "original_name": filename,
                "file_type": ext.lstrip('.').upper(),
                "mime_type": content_type,
                "file_size": len(file_data),
                "checksum": checksum,
                "is_dicom": ext in ('.dcm', '.dicom'),
            }

        except S3Error as e:
            logger.error("MinIO upload failed", error=str(e), key=minio_key)
            raise RuntimeError(f"File upload failed: {str(e)}")

    def generate_signed_url(
        self,
        bucket: str,
        key: str,
        expires_in: int = 3600,
    ) -> str:
        """Generate a presigned URL for secure file access."""
        try:
            url = self.client.presigned_get_object(
                bucket_name=bucket,
                object_name=key,
                expires=timedelta(seconds=min(expires_in, 86400)),  # Max 24 hours
            )
            logger.info("Signed URL generated", bucket=bucket, key=key, expires_in=expires_in)
            return url
        except S3Error as e:
            logger.error("Failed to generate signed URL", error=str(e))
            raise RuntimeError(f"Failed to generate signed URL: {str(e)}")

    def generate_upload_signed_url(
        self,
        bucket: str,
        key: str,
        expires_in: int = 900,
    ) -> str:
        """Generate a presigned URL for direct file upload (PUT)."""
        try:
            url = self.client.presigned_put_object(
                bucket_name=bucket,
                object_name=key,
                expires=timedelta(seconds=expires_in),
            )
            return url
        except S3Error as e:
            raise RuntimeError(f"Failed to generate upload URL: {str(e)}")

    def delete_file(self, bucket: str, key: str) -> None:
        """Delete a file from MinIO."""
        try:
            self.client.remove_object(bucket_name=bucket, object_name=key)
            logger.info("File deleted from MinIO", bucket=bucket, key=key)
        except S3Error as e:
            logger.error("Failed to delete file", error=str(e))
            raise

    def get_file(self, bucket: str, key: str) -> bytes:
        """Download file content from MinIO."""
        try:
            response = self.client.get_object(bucket_name=bucket, object_name=key)
            return response.read()
        except S3Error as e:
            raise RuntimeError(f"Failed to download file: {str(e)}")
        finally:
            try:
                response.close()
                response.release_conn()
            except Exception:
                pass

    def list_files(self, bucket: str, prefix: str) -> list:
        """List files in a bucket with given prefix."""
        try:
            objects = self.client.list_objects(bucket_name=bucket, prefix=prefix, recursive=True)
            return [
                {
                    "key": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified,
                    "etag": obj.etag,
                }
                for obj in objects
            ]
        except S3Error as e:
            logger.error("Failed to list files", error=str(e))
            return []

    async def initialize_all_buckets(self) -> None:
        """Initialize all required buckets on startup."""
        buckets = [
            settings.MINIO_BUCKET_LAB,
            settings.MINIO_BUCKET_DICOM,
            settings.MINIO_BUCKET_REPORTS,
        ]
        for bucket in buckets:
            await self.ensure_bucket(bucket)
        logger.info("All MinIO buckets initialized", buckets=buckets)


# Singleton instance
minio_service = MinIOService()
