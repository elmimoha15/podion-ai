import os
import logging
import tempfile
from typing import Optional, Tuple, Dict
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import storage
from fastapi import HTTPException, UploadFile
import uuid
import time
from google.cloud import storage as gcs

logger = logging.getLogger(__name__)

def get_firebase_bucket():
    """Get Firebase Storage bucket instance with proper timeout configuration"""
    try:
        # You'll need to set this in your .env file
        bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")
        if not bucket_name:
            raise ValueError("FIREBASE_STORAGE_BUCKET not configured in environment variables")
        
        bucket = storage.bucket(bucket_name)
        return bucket
    except Exception as e:
        logger.error(f"Failed to get Firebase Storage bucket: {e}")
        raise HTTPException(status_code=500, detail="Firebase Storage not available")

def get_gcs_client():
    """Get Google Cloud Storage client with proper timeout configuration"""
    try:
        # Use the same credentials as Firebase Admin SDK
        client = gcs.Client()
        return client
    except Exception as e:
        logger.error(f"Failed to get GCS client: {e}")
        raise HTTPException(status_code=500, detail="Google Cloud Storage not available")

def generate_safe_filename(original_filename: str) -> str:
    """Generate a safe filename with timestamp and UUID"""
    # Get file extension
    file_ext = os.path.splitext(original_filename)[1].lower()
    
    # Generate unique identifier
    unique_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Create safe filename
    safe_filename = f"{timestamp}_{unique_id}{file_ext}"
    return safe_filename

def upload_audio_file(
    file: UploadFile,
    user_id: str,
    custom_filename: Optional[str] = None
) -> Tuple[str, str]:
    """
    Upload audio file to Firebase Storage with improved timeout handling and chunked uploads
    
    Args:
        file: FastAPI UploadFile object
        user_id: User ID for organizing files
        custom_filename: Optional custom filename (will be made safe)
    
    Returns:
        Tuple of (storage_path, public_url)
    """
    try:
        upload_start_time = time.time()
        
        # Get Firebase Storage bucket
        bucket = get_firebase_bucket()
        
        # Generate safe filename
        if custom_filename:
            filename = generate_safe_filename(custom_filename)
        else:
            filename = generate_safe_filename(file.filename or "audio_file")
        
        # Create storage path: /users/{user_id}/podcasts/{filename}
        storage_path = f"users/{user_id}/podcasts/{filename}"
        
        logger.info(f"🚀 Starting upload to Firebase Storage: {storage_path}")
        
        # Check file size to determine upload strategy
        file_content = file.file.read()
        file_size = len(file_content)
        
        logger.info(f"📁 File size: {file_size} bytes ({file_size / (1024*1024):.2f} MB)")
        
        # Create blob in Firebase Storage
        blob = bucket.blob(storage_path)
        
        # Set metadata
        blob.metadata = {
            "original_filename": file.filename or "unknown",
            "content_type": file.content_type or "audio/mpeg",
            "uploaded_at": datetime.now().isoformat(),
            "user_id": user_id,
            "upload_start_time": upload_start_time
        }
        
        upload_method_start = time.time()
        
        # Use different upload strategies based on file size
        if file_size < 50 * 1024 * 1024:  # Less than 50MB - direct upload
            logger.info("📤 Using direct upload for small file")
            upload_success = _upload_direct(blob, file_content, file.content_type)
        else:  # 50MB+ - use resumable upload
            logger.info("📤 Using resumable upload for large file")
            upload_success = _upload_resumable(blob, file_content, file.content_type, file_size)
        
        if not upload_success:
            raise Exception("Upload failed after all retry attempts")
        
        upload_method_time = time.time() - upload_method_start
        
        # Generate public URL (expires in 7 days)
        public_url = generate_public_url(storage_path, expires_in_days=7)
        
        total_upload_time = time.time() - upload_start_time
        upload_speed_mbps = (file_size / (1024 * 1024)) / total_upload_time if total_upload_time > 0 else 0
        
        logger.info(f"✅ Upload completed successfully: {storage_path}")
        logger.info(f"⏱️  Total upload time: {total_upload_time:.2f} seconds")
        logger.info(f"📊 Upload speed: {upload_speed_mbps:.2f} MB/s")
        logger.info(f"🔗 Public URL generated: {public_url[:50]}...")
        
        return storage_path, public_url
        
    except Exception as e:
        logger.error(f"Failed to upload file to Firebase Storage: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file to cloud storage: {str(e)}"
        )

def _upload_direct(blob, file_content: bytes, content_type: str, max_retries: int = 3) -> bool:
    """Direct upload for smaller files with retry logic"""
    for attempt in range(max_retries):
        try:
            logger.info(f"Direct upload attempt {attempt + 1}/{max_retries}")
            
            # Upload with a reasonable timeout
            blob.upload_from_string(
                file_content,
                content_type=content_type or "audio/mpeg",
                timeout=300  # 5 minutes timeout
            )
            
            logger.info("Direct upload completed successfully")
            return True
            
        except Exception as e:
            logger.warning(f"Direct upload attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                logger.error("All direct upload attempts failed")
                return False
    
    return False

def _upload_resumable(blob, file_content: bytes, content_type: str, file_size: int, max_retries: int = 3) -> bool:
    """Resumable upload for larger files with better timeout handling"""
    for attempt in range(max_retries):
        try:
            logger.info(f"Resumable upload attempt {attempt + 1}/{max_retries}")
            
            # Create a temporary file for resumable upload
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name
            
            try:
                # Calculate timeout based on file size (minimum 10 minutes, scale with size)
                base_timeout = 600  # 10 minutes base
                size_factor = file_size / (100 * 1024 * 1024)  # Scale per 100MB
                upload_timeout = max(base_timeout, int(base_timeout * size_factor))
                
                logger.info(f"Using upload timeout: {upload_timeout} seconds ({upload_timeout/60:.1f} minutes)")
                
                # Use resumable upload with proper timeout
                blob.upload_from_filename(
                    temp_file_path,
                    content_type=content_type or "audio/mpeg",
                    timeout=upload_timeout
                )
                
                logger.info("Resumable upload completed successfully")
                return True
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
            
        except Exception as e:
            logger.warning(f"Resumable upload attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                wait_time = 5 * (attempt + 1)  # Linear backoff for large files
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                logger.error("All resumable upload attempts failed")
                return False
    
    return False

def upload_from_local_file(
    local_file_path: str,
    user_id: str,
    filename: Optional[str] = None
) -> Tuple[str, str]:
    """
    Upload a local file to Firebase Storage with improved timeout handling
    
    Args:
        local_file_path: Path to local file
        user_id: User ID for organizing files
        filename: Optional custom filename
    
    Returns:
        Tuple of (storage_path, public_url)
    """
    try:
        bucket = get_firebase_bucket()
        
        # Generate filename
        if not filename:
            filename = os.path.basename(local_file_path)
        safe_filename = generate_safe_filename(filename)
        
        # Create storage path
        storage_path = f"users/{user_id}/podcasts/{safe_filename}"
        
        upload_start_time = time.time()
        
        logger.info(f"🚀 Starting local file upload to Firebase Storage: {storage_path}")
        
        # Get file size for timeout calculation
        file_size = os.path.getsize(local_file_path)
        logger.info(f"📁 Local file size: {file_size} bytes ({file_size / (1024*1024):.2f} MB)")
        
        # Create blob and upload
        blob = bucket.blob(storage_path)
        blob.metadata = {
            "original_filename": filename,
            "uploaded_at": datetime.now().isoformat(),
            "user_id": user_id
        }
        
        # Calculate timeout based on file size (minimum 10 minutes, scale with size)
        base_timeout = 600  # 10 minutes base
        size_factor = file_size / (100 * 1024 * 1024)  # Scale per 100MB
        upload_timeout = max(base_timeout, int(base_timeout * size_factor))
        
        logger.info(f"Using upload timeout: {upload_timeout} seconds ({upload_timeout/60:.1f} minutes)")
        
        # Upload with proper timeout and retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.info(f"Local file upload attempt {attempt + 1}/{max_retries}")
                
                blob.upload_from_filename(
                    local_file_path,
                    timeout=upload_timeout
                )
                
                logger.info("Local file upload completed successfully")
                break
                
            except Exception as e:
                logger.warning(f"Local file upload attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    wait_time = 5 * (attempt + 1)  # Linear backoff
                    logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise e
        
        # Generate public URL
        public_url = generate_public_url(storage_path, expires_in_days=7)
        
        total_upload_time = time.time() - upload_start_time
        upload_speed_mbps = (file_size / (1024 * 1024)) / total_upload_time if total_upload_time > 0 else 0
        
        logger.info(f"✅ Local file uploaded successfully: {storage_path}")
        logger.info(f"⏱️  Total upload time: {total_upload_time:.2f} seconds")
        logger.info(f"📊 Upload speed: {upload_speed_mbps:.2f} MB/s")
        
        return storage_path, public_url
        
    except Exception as e:
        logger.error(f"Failed to upload local file to Firebase Storage: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload local file to cloud storage: {str(e)}"
        )

def generate_public_url(storage_path: str, expires_in_days: int = 7) -> str:
    """
    Generate a public download URL for a file in Firebase Storage
    
    Args:
        storage_path: Path to file in storage (e.g., "users/123/podcasts/file.mp3")
        expires_in_days: Number of days until URL expires
    
    Returns:
        Public download URL
    """
    try:
        bucket = get_firebase_bucket()
        blob = bucket.blob(storage_path)
        
        # Generate signed URL that expires in specified days
        expiration = datetime.now() + timedelta(days=expires_in_days)
        
        url = blob.generate_signed_url(
            expiration=expiration,
            method="GET"
        )
        
        return url
        
    except Exception as e:
        logger.error(f"Failed to generate public URL for {storage_path}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate download URL: {str(e)}"
        )

def delete_file(storage_path: str) -> bool:
    """
    Delete a file from Firebase Storage
    
    Args:
        storage_path: Path to file in storage
    
    Returns:
        True if deleted successfully
    """
    try:
        bucket = get_firebase_bucket()
        blob = bucket.blob(storage_path)
        blob.delete()
        
        logger.info(f"File deleted from Firebase Storage: {storage_path}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to delete file from Firebase Storage: {e}")
        return False

def list_user_files(user_id: str, limit: int = 100) -> list:
    """
    List all files for a specific user
    
    Args:
        user_id: User ID
        limit: Maximum number of files to return
    
    Returns:
        List of file information dictionaries
    """
    try:
        bucket = get_firebase_bucket()
        prefix = f"users/{user_id}/podcasts/"
        
        blobs = bucket.list_blobs(prefix=prefix, max_results=limit)
        
        files = []
        for blob in blobs:
            files.append({
                "storage_path": blob.name,
                "filename": os.path.basename(blob.name),
                "size": blob.size,
                "created": blob.time_created.isoformat() if blob.time_created else None,
                "content_type": blob.content_type,
                "metadata": blob.metadata or {}
            })
        
        return files
        
    except Exception as e:
        logger.error(f"Failed to list user files: {e}")
        return []

def get_file_info(storage_path: str) -> dict:
    """
    Get information about a specific file
    
    Args:
        storage_path: Path to file in storage
    
    Returns:
        File information dictionary
    """
    try:
        bucket = get_firebase_bucket()
        blob = bucket.blob(storage_path)
        
        if not blob.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        return {
            "storage_path": blob.name,
            "filename": os.path.basename(blob.name),
            "size": blob.size,
            "created": blob.time_created.isoformat() if blob.time_created else None,
            "updated": blob.updated.isoformat() if blob.updated else None,
            "content_type": blob.content_type,
            "metadata": blob.metadata or {},
            "public_url": generate_public_url(storage_path)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get file info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get file information")

def generate_signed_upload_url(
    user_id: str,
    filename: str,
    content_type: str = "audio/mpeg",
    expires_in_minutes: int = 60
) -> Dict[str, str]:
    """
    Generate a signed URL for direct client-side upload to Firebase Storage
    This bypasses the server entirely for much faster uploads
    
    Args:
        user_id: User ID for organizing files
        filename: Original filename
        content_type: MIME type of the file
        expires_in_minutes: How long the URL is valid
    
    Returns:
        Dictionary with signed_url, storage_path, and other metadata
    """
    try:
        # Generate safe filename
        safe_filename = generate_safe_filename(filename)
        storage_path = f"users/{user_id}/podcasts/{safe_filename}"
        
        logger.info(f"Generating signed upload URL for: {storage_path}")
        
        # Get Firebase Storage bucket
        bucket = get_firebase_bucket()
        blob = bucket.blob(storage_path)
        
        # Generate signed URL for PUT request (upload)
        expiration = datetime.now() + timedelta(minutes=expires_in_minutes)
        
        signed_url = blob.generate_signed_url(
            expiration=expiration,
            method="PUT",
            content_type=content_type
        )
        
        return {
            "signed_url": signed_url,
            "storage_path": storage_path,
            "safe_filename": safe_filename,
            "expires_at": expiration.isoformat(),
            "content_type": content_type,
            "method": "PUT"
        }
        
    except Exception as e:
        logger.error(f"Failed to generate signed upload URL: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate upload URL: {str(e)}"
        )

def confirm_direct_upload(storage_path: str, user_id: str) -> Tuple[str, dict]:
    """
    Confirm that a direct upload was successful and get file info
    
    Args:
        storage_path: Path where file was uploaded
        user_id: User ID to verify ownership
    
    Returns:
        Tuple of (public_url, file_info)
    """
    try:
        bucket = get_firebase_bucket()
        blob = bucket.blob(storage_path)
        
        # Check if file exists and user owns it
        if not blob.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Verify user ownership
        if not storage_path.startswith(f"users/{user_id}/"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update metadata
        blob.reload()  # Refresh blob metadata
        metadata = blob.metadata or {}
        metadata.update({
            "upload_confirmed_at": datetime.now().isoformat(),
            "upload_method": "direct_client_upload"
        })
        blob.metadata = metadata
        blob.patch()
        
        # Generate public URL
        public_url = generate_public_url(storage_path, expires_in_days=7)
        
        file_info = {
            "storage_path": storage_path,
            "filename": os.path.basename(storage_path),
            "size": blob.size,
            "content_type": blob.content_type,
            "public_url": public_url,
            "upload_method": "direct_client_upload"
        }
        
        logger.info(f"Direct upload confirmed: {storage_path} ({blob.size} bytes)")
        
        return public_url, file_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to confirm direct upload: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to confirm upload: {str(e)}"
        )

def upload_audio_file_streaming(
    file: UploadFile,
    user_id: str,
    custom_filename: Optional[str] = None
) -> Tuple[str, str]:
    """
    Fast streaming upload for server-side uploads (no memory loading)
    
    Args:
        file: FastAPI UploadFile object
        user_id: User ID for organizing files
        custom_filename: Optional custom filename
    
    Returns:
        Tuple of (storage_path, public_url)
    """
    try:
        upload_start_time = time.time()
        
        # Generate safe filename and storage path
        if custom_filename:
            filename = generate_safe_filename(custom_filename)
        else:
            filename = generate_safe_filename(file.filename or "audio_file")
        
        storage_path = f"users/{user_id}/podcasts/{filename}"
        
        logger.info(f"🚀 Starting streaming upload to: {storage_path}")
        
        # Get Firebase Storage bucket
        bucket = get_firebase_bucket()
        blob = bucket.blob(storage_path)
        
        # Set metadata
        blob.metadata = {
            "original_filename": file.filename or "unknown",
            "content_type": file.content_type or "audio/mpeg",
            "uploaded_at": datetime.now().isoformat(),
            "user_id": user_id,
            "upload_method": "server_streaming",
            "upload_start_time": upload_start_time
        }
        
        # Use streaming upload (no memory loading)
        max_retries = 3
        upload_attempt_start = time.time()
        
        for attempt in range(max_retries):
            try:
                logger.info(f"📤 Streaming upload attempt {attempt + 1}/{max_retries}")
                
                # Reset file pointer
                file.file.seek(0)
                
                # Stream upload with timeout
                blob.upload_from_file(
                    file.file,
                    content_type=file.content_type or "audio/mpeg",
                    timeout=1800  # 30 minutes max
                )
                
                logger.info("✅ Streaming upload completed successfully")
                break
                
            except Exception as e:
                logger.warning(f"❌ Streaming upload attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    wait_time = 5 * (attempt + 1)
                    logger.info(f"⏳ Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise e
        
        upload_method_time = time.time() - upload_attempt_start
        
        # Generate public URL
        public_url = generate_public_url(storage_path, expires_in_days=7)
        
        # Get file size for speed calculation
        blob.reload()
        file_size = blob.size
        
        total_upload_time = time.time() - upload_start_time
        upload_speed_mbps = (file_size / (1024 * 1024)) / total_upload_time if total_upload_time > 0 else 0
        
        logger.info(f"✅ Streaming upload successful: {storage_path}")
        logger.info(f"📁 File size: {file_size} bytes ({file_size / (1024*1024):.2f} MB)")
        logger.info(f"⏱️  Total upload time: {total_upload_time:.2f} seconds")
        logger.info(f"📊 Upload speed: {upload_speed_mbps:.2f} MB/s")
        
        return storage_path, public_url
        
    except Exception as e:
        logger.error(f"Streaming upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Streaming upload failed: {str(e)}"
        ) 