from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import logging
from utils.firebase_storage import (
    upload_audio_file,
    upload_from_local_file,
    generate_public_url,
    delete_file,
    list_user_files,
    get_file_info,
    generate_signed_upload_url,
    confirm_direct_upload,
    upload_audio_file_streaming
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Pydantic models
class FileUploadResponse(BaseModel):
    success: bool
    storage_path: Optional[str] = None
    public_url: Optional[str] = None
    filename: Optional[str] = None
    file_size: Optional[int] = None
    user_id: Optional[str] = None
    expires_at: Optional[str] = None
    error: Optional[str] = None

class FileInfoResponse(BaseModel):
    success: bool
    file_info: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class FileListResponse(BaseModel):
    success: bool
    files: Optional[List[Dict[str, Any]]] = None
    count: Optional[int] = None
    user_id: Optional[str] = None
    error: Optional[str] = None

class UrlGenerationRequest(BaseModel):
    storage_path: str = Field(..., description="Path to file in Firebase Storage")
    expires_in_days: int = Field(7, description="Number of days until URL expires", ge=1, le=30)

class UrlGenerationResponse(BaseModel):
    success: bool
    public_url: Optional[str] = None
    storage_path: Optional[str] = None
    expires_in_days: Optional[int] = None
    error: Optional[str] = None

class DeleteFileResponse(BaseModel):
    success: bool
    storage_path: Optional[str] = None
    error: Optional[str] = None

class SignedUploadRequest(BaseModel):
    user_id: str = Field(..., description="User ID for organizing files")
    filename: str = Field(..., description="Original filename")
    content_type: str = Field("audio/mpeg", description="MIME type of the file")
    expires_in_minutes: int = Field(60, description="URL expiration time in minutes", ge=5, le=240)

class SignedUploadResponse(BaseModel):
    success: bool
    signed_url: Optional[str] = None
    storage_path: Optional[str] = None
    expires_at: Optional[str] = None
    upload_instructions: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ConfirmUploadRequest(BaseModel):
    storage_path: str = Field(..., description="Path where file was uploaded")
    user_id: str = Field(..., description="User ID to verify ownership")

class ConfirmUploadResponse(BaseModel):
    success: bool
    public_url: Optional[str] = None
    file_info: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file_to_storage(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    custom_filename: Optional[str] = Form(None)
):
    """
    Upload an audio file to Firebase Storage
    
    - **file**: Audio file to upload (MP3, M4A, WAV, FLAC, OGG)
    - **user_id**: User ID for organizing files (required)
    - **custom_filename**: Optional custom filename (will be made safe)
    
    Returns storage path and public download URL (expires in 7 days)
    """
    
    try:
        # Validate file type
        allowed_types = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/flac", "audio/ogg", "audio/x-m4a"]
        allowed_extensions = [".mp3", ".m4a", ".wav", ".flac", ".ogg"]
        
        file_ext = os.path.splitext(file.filename or "")[1].lower()
        
        if file.content_type not in allowed_types and file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Validate file size (max 500MB for podcast files)
        file_content = await file.read()
        file_size = len(file_content)
        max_size = 500 * 1024 * 1024  # 500MB
        
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File too large. Maximum size is 500MB"
            )
        
        # Reset file pointer
        await file.seek(0)
        
        logger.info(f"Uploading file for user {user_id}: {file.filename} ({file_size} bytes)")
        
        # Upload to Firebase Storage
        storage_path, public_url = upload_audio_file(
            file=file,
            user_id=user_id,
            custom_filename=custom_filename
        )
        
        logger.info(f"File uploaded successfully: {storage_path}")
        
        return FileUploadResponse(
            success=True,
            storage_path=storage_path,
            public_url=public_url,
            filename=os.path.basename(storage_path),
            file_size=file_size,
            user_id=user_id,
            expires_at="7 days from upload"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"File upload failed: {str(e)}")
        
        return FileUploadResponse(
            success=False,
            error=f"File upload failed: {str(e)}"
        )

@router.get("/files/{user_id}", response_model=FileListResponse)
async def list_user_audio_files(user_id: str, limit: int = 50):
    """
    List all audio files for a specific user
    
    - **user_id**: User ID to get files for
    - **limit**: Maximum number of files to return (default: 50, max: 100)
    """
    
    try:
        if limit > 100:
            limit = 100
        
        logger.info(f"Listing files for user {user_id} (limit: {limit})")
        
        files = list_user_files(user_id=user_id, limit=limit)
        
        logger.info(f"Found {len(files)} files for user {user_id}")
        
        return FileListResponse(
            success=True,
            files=files,
            count=len(files),
            user_id=user_id
        )
        
    except Exception as e:
        logger.error(f"Failed to list files for user {user_id}: {str(e)}")
        
        return FileListResponse(
            success=False,
            error=f"Failed to list files: {str(e)}"
        )

@router.get("/file-info", response_model=FileInfoResponse)
async def get_file_information(storage_path: str):
    """
    Get detailed information about a specific file
    
    - **storage_path**: Full path to file in Firebase Storage
    """
    
    try:
        logger.info(f"Getting file info for: {storage_path}")
        
        file_info = get_file_info(storage_path)
        
        return FileInfoResponse(
            success=True,
            file_info=file_info
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Failed to get file info: {str(e)}")
        
        return FileInfoResponse(
            success=False,
            error=f"Failed to get file information: {str(e)}"
        )

@router.post("/generate-url", response_model=UrlGenerationResponse)
async def generate_download_url(request: UrlGenerationRequest):
    """
    Generate a new public download URL for an existing file
    
    - **storage_path**: Path to file in Firebase Storage
    - **expires_in_days**: Number of days until URL expires (1-30, default: 7)
    """
    
    try:
        logger.info(f"Generating URL for {request.storage_path} (expires in {request.expires_in_days} days)")
        
        public_url = generate_public_url(
            storage_path=request.storage_path,
            expires_in_days=request.expires_in_days
        )
        
        return UrlGenerationResponse(
            success=True,
            public_url=public_url,
            storage_path=request.storage_path,
            expires_in_days=request.expires_in_days
        )
        
    except Exception as e:
        logger.error(f"Failed to generate URL: {str(e)}")
        
        return UrlGenerationResponse(
            success=False,
            storage_path=request.storage_path,
            error=f"Failed to generate download URL: {str(e)}"
        )

@router.delete("/file", response_model=DeleteFileResponse)
async def delete_audio_file(storage_path: str):
    """
    Delete a file from Firebase Storage
    
    - **storage_path**: Full path to file in Firebase Storage
    
    **Warning**: This action cannot be undone!
    """
    
    try:
        logger.info(f"Deleting file: {storage_path}")
        
        success = delete_file(storage_path)
        
        if success:
            return DeleteFileResponse(
                success=True,
                storage_path=storage_path
            )
        else:
            return DeleteFileResponse(
                success=False,
                storage_path=storage_path,
                error="Failed to delete file"
            )
        
    except Exception as e:
        logger.error(f"Failed to delete file: {str(e)}")
        
        return DeleteFileResponse(
            success=False,
            storage_path=storage_path,
            error=f"Failed to delete file: {str(e)}"
        )

@router.get("/storage")
async def storage_service_info():
    """Get information about the Firebase Storage service"""
    return {
        "message": "Firebase Storage service for audio file management",
        "features": [
            "Upload audio files to cloud storage",
            "Organize files by user ID",
            "Generate secure download URLs",
            "List user files",
            "Delete files",
            "File metadata and information"
        ],
        "supported_formats": ["MP3", "M4A", "WAV", "FLAC", "OGG"],
        "max_file_size": "500MB",
        "storage_structure": "/users/{user_id}/podcasts/{filename}",
        "url_expiration": "Configurable (1-30 days, default: 7 days)",
        "endpoints": {
            "upload": "POST /upload - Upload audio file",
            "list": "GET /files/{user_id} - List user files",
            "info": "GET /file-info?storage_path=... - Get file information",
            "url": "POST /generate-url - Generate new download URL",
            "delete": "DELETE /file?storage_path=... - Delete file"
        },
        "integration": {
            "transcription": "Use public URLs with /api/v1/transcribe endpoint",
            "workflow": "Upload → Get URL → Transcribe → Generate SEO content"
        }
    }

@router.post("/generate-upload-url", response_model=SignedUploadResponse)
async def generate_upload_url(request: SignedUploadRequest):
    """
    Generate a signed URL for direct client-side upload to Firebase Storage.
    This is the FASTEST upload method as it bypasses the server entirely.
    
    Use this for large files to get maximum upload speed.
    """
    try:
        logger.info(f"Generating upload URL for user {request.user_id}: {request.filename}")
        
        # Generate signed upload URL
        upload_data = generate_signed_upload_url(
            user_id=request.user_id,
            filename=request.filename,
            content_type=request.content_type,
            expires_in_minutes=request.expires_in_minutes
        )
        
        instructions = {
            "method": "PUT",
            "headers": {
                "Content-Type": request.content_type
            },
            "note": "Upload file directly to signed_url using PUT request with specified Content-Type header"
        }
        
        return SignedUploadResponse(
            success=True,
            signed_url=upload_data["signed_url"],
            storage_path=upload_data["storage_path"],
            expires_at=upload_data["expires_at"],
            upload_instructions=instructions
        )
        
    except Exception as e:
        logger.error(f"Failed to generate upload URL: {str(e)}")
        return SignedUploadResponse(
            success=False,
            error=f"Failed to generate upload URL: {str(e)}"
        )

@router.post("/confirm-upload", response_model=ConfirmUploadResponse)
async def confirm_upload(request: ConfirmUploadRequest):
    """
    Confirm that a direct client upload was successful and get file info.
    Call this after successfully uploading to the signed URL.
    """
    try:
        logger.info(f"Confirming upload for user {request.user_id}: {request.storage_path}")
        
        # Confirm upload and get file info
        public_url, file_info = confirm_direct_upload(
            storage_path=request.storage_path,
            user_id=request.user_id
        )
        
        return ConfirmUploadResponse(
            success=True,
            public_url=public_url,
            file_info=file_info
        )
        
    except Exception as e:
        logger.error(f"Failed to confirm upload: {str(e)}")
        return ConfirmUploadResponse(
            success=False,
            error=f"Failed to confirm upload: {str(e)}"
        )

@router.post("/upload-streaming", response_model=FileUploadResponse)
async def upload_file_streaming(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    custom_filename: Optional[str] = Form(None)
):
    """
    Fast streaming upload for server-side uploads (no memory loading).
    Use this as fallback when direct client upload is not possible.
    
    - **file**: Audio file to upload (MP3, M4A, WAV, FLAC, OGG)
    - **user_id**: User ID for organizing files (required)
    - **custom_filename**: Optional custom filename (will be made safe)
    
    This method is faster than regular upload for large files as it streams
    data directly without loading everything into memory.
    """
    try:
        # Validate file type
        allowed_types = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/flac", "audio/ogg", "audio/x-m4a"]
        allowed_extensions = [".mp3", ".m4a", ".wav", ".flac", ".ogg"]
        
        file_ext = os.path.splitext(file.filename or "")[1].lower()
        
        if file.content_type not in allowed_types and file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        logger.info(f"Starting streaming upload for user {user_id}: {file.filename}")
        
        # Use streaming upload
        storage_path, public_url = upload_audio_file_streaming(
            file=file,
            user_id=user_id,
            custom_filename=custom_filename
        )
        
        # Get file size after upload
        from utils.firebase_storage import get_file_info
        file_info = get_file_info(storage_path)
        
        logger.info(f"Streaming upload completed: {storage_path}")
        
        return FileUploadResponse(
            success=True,
            storage_path=storage_path,
            public_url=public_url,
            filename=os.path.basename(storage_path),
            file_size=file_info.get("size"),
            user_id=user_id,
            expires_at="7 days from upload"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Streaming upload failed: {str(e)}")
        
        return FileUploadResponse(
            success=False,
            error=f"Streaming upload failed: {str(e)}"
        ) 