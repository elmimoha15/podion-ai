from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import logging
import tempfile
import httpx
import asyncio
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Supported audio file types for podcast episodes
SUPPORTED_AUDIO_TYPES = {
    "audio/mpeg",      # MP3
    "audio/mp4",       # M4A
    "audio/wav",       # WAV
    "audio/x-wav",     # Alternative WAV MIME type
    "audio/mp3",       # Alternative MP3 MIME type
    "audio/m4a",       # M4A MIME type
    "audio/flac",      # FLAC (high-quality podcasts)
    "audio/ogg",       # OGG (open source podcasts)
}

SUPPORTED_EXTENSIONS = {".mp3", ".m4a", ".wav", ".mp4", ".flac", ".ogg"}

# Pydantic models
class WordTimestamp(BaseModel):
    word: str
    start: float
    end: float
    confidence: float
    speaker: Optional[int] = None

class TranscriptionResponse(BaseModel):
    success: bool
    transcript: Optional[str] = None
    words: Optional[List[WordTimestamp]] = None
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class UrlTranscriptionRequest(BaseModel):
    file_url: str
    custom_filename: Optional[str] = None

def validate_audio_file(file: UploadFile) -> dict:
    """Validate if the uploaded file is a supported audio format"""
    # Check MIME type
    if file.content_type and file.content_type.lower() in SUPPORTED_AUDIO_TYPES:
        return {"valid": True, "error": None}
    
    # Check file extension as fallback
    if file.filename:
        file_ext = Path(file.filename).suffix.lower()
        if file_ext in SUPPORTED_EXTENSIONS:
            return {"valid": True, "error": None}
    
    # Invalid file type
    supported_types = ", ".join(SUPPORTED_EXTENSIONS)
    error_msg = f"Unsupported file type. Please upload one of: {supported_types}"
    return {"valid": False, "error": error_msg}

def get_deepgram_api_key() -> str:
    """Get Deepgram API key from environment variables"""
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key or api_key == "your-deepgram-api-key-here":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Deepgram API key not configured. Please set DEEPGRAM_API_KEY environment variable."
        )
    return api_key

async def download_audio_from_url(url: str, custom_filename: Optional[str] = None) -> str:
    """Download audio file from URL and save to temporary file"""
    
    try:
        # Validate URL format
        if not url.startswith(('http://', 'https://')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid URL format. Must be HTTP or HTTPS."
            )
        
        # Download with timeout
        async with httpx.AsyncClient(timeout=300) as client:  # 5 minute timeout for download
            response = await client.get(url)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to download file from URL: HTTP {response.status_code}"
                )
            
            # Determine file extension from URL or use custom filename
            if custom_filename:
                file_extension = Path(custom_filename).suffix
            else:
                # Try to get extension from URL
                url_path = Path(url.split('?')[0])  # Remove query parameters
                file_extension = url_path.suffix if url_path.suffix else '.mp3'
            
            # Validate it's an audio file extension
            if file_extension.lower() not in SUPPORTED_EXTENSIONS:
                file_extension = '.mp3'  # Default to MP3
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                temp_file.write(response.content)
                temp_file_path = temp_file.name
            
            logger.info(f"Downloaded audio from URL: {len(response.content)} bytes")
            return temp_file_path
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Timeout downloading file from URL"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download file from URL: {str(e)}"
        )

async def transcribe_with_deepgram_api(audio_file_path: str, filename: str, max_retries: int = 2) -> dict:
    """Send audio file to Deepgram REST API and get transcription with word timestamps"""
    
    api_key = get_deepgram_api_key()
    
    # Deepgram API endpoint
    url = "https://api.deepgram.com/v1/listen"
    
    # Parameters for Nova-2 model with word timestamps and speaker diarization
    params = {
        "model": "nova-2",
        "smart_format": "true",
        "punctuate": "true", 
        "diarize": "true",
        "utterances": "true",
        "utt_split": "0.8",
        "language": "en-US"
    }
    
    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": "audio/*"  # Let Deepgram auto-detect format
    }
    
    # Calculate dynamic timeout based on file size
    file_size_mb = os.path.getsize(audio_file_path) / (1024 * 1024)
    
    # Dynamic timeout: minimum 10 minutes, scale with file size
    if file_size_mb < 10:
        timeout_seconds = 600  # 10 minutes for small files
    elif file_size_mb < 50:
        timeout_seconds = 1800  # 30 minutes for medium podcast episodes
    elif file_size_mb < 150:
        timeout_seconds = 3600  # 60 minutes for long episodes
    else:
        timeout_seconds = 5400  # 90 minutes for very large files
    

    
    # Read the audio file once
    try:
        with open(audio_file_path, "rb") as audio_file:
            audio_data = audio_file.read()

    except Exception as e:
        logger.error(f"Failed to read audio file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read audio file: {str(e)}"
        )
    
    # Retry logic for large files
    for attempt in range(max_retries + 1):
        try:
            if attempt > 0:
                # Wait longer between retries for large files
                wait_time = min(30, 5 * attempt)
                await asyncio.sleep(wait_time)
            
            # Send to Deepgram API with dynamic timeout
            async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                response = await client.post(
                    url, 
                    params=params,
                    headers=headers,
                    content=audio_data
                )
                
            if response.status_code != 200:
                error_msg = f"Deepgram API error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                
                # Don't retry on certain errors (auth, format, etc.)
                if response.status_code in [400, 401, 403, 415]:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=error_msg
                    )
                
                # Retry on server errors or rate limits
                if attempt < max_retries:
                    continue
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=error_msg
                    )
            
            result = response.json()
            return result
            
        except httpx.TimeoutException:
            error_msg = f"Request to Deepgram API timed out after {timeout_seconds/60:.1f} minutes"
            logger.error(error_msg)
            
            if attempt < max_retries:
                continue
            else:
                raise HTTPException(
                    status_code=status.HTTP_408_REQUEST_TIMEOUT,
                    detail=f"{error_msg}. Large podcast files may take longer to process."
                )
                
        except Exception as e:
            error_msg = f"Error calling Deepgram API: {str(e)}"
            logger.error(error_msg)
            
            # Don't retry on unexpected errors
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )

def extract_words_with_speakers(deepgram_response: dict) -> tuple[str, List[WordTimestamp]]:
    """Extract transcript and word-level timestamps with speaker info from Deepgram response"""
    
    transcript = ""
    words = []
    
    try:
        if not deepgram_response.get("results"):
            return "", []
        
        results = deepgram_response["results"]
        if not results.get("channels") or len(results["channels"]) == 0:
            return "", []
        
        channel = results["channels"][0]
        if not channel.get("alternatives") or len(channel["alternatives"]) == 0:
            return "", []
        
        alternative = channel["alternatives"][0]
        transcript = alternative.get("transcript", "")
        
        # Extract word-level timestamps
        if alternative.get("words"):
            for word_data in alternative["words"]:
                word_obj = WordTimestamp(
                    word=word_data.get("punctuated_word", word_data.get("word", "")),
                    start=round(word_data.get("start", 0.0), 2),
                    end=round(word_data.get("end", 0.0), 2),
                    confidence=round(word_data.get("confidence", 0.0), 3),
                    speaker=word_data.get("speaker")  # Speaker ID from diarization
                )
                words.append(word_obj)
        

        
        return transcript, words
        
    except Exception as e:
        logger.error(f"Error extracting words and speakers: {str(e)}")
        return transcript, []

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(..., description="Podcast episode to transcribe (MP3, M4A, WAV, FLAC, OGG) - up to 500MB")
):
    """
    Transcribe podcast episodes using Deepgram Nova-2 REST API
    
    Perfect for podcasters who need:
    - Word-level timestamps with speaker diarization (host vs guests)
    - Smart formatting and punctuation for easy editing
    - Support for large files (up to 500MB) and long episodes (90+ minutes)
    - Multiple formats: MP3, M4A, WAV, FLAC, OGG
    - Automatic retry logic for reliable processing of large files
    """
    
    temp_file_path = None
    
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No filename provided"
            )
        
        # Validate audio format
        if not validate_audio_file(file):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format. Supported formats: {', '.join(SUPPORTED_EXTENSIONS)}"
            )
        
        # Check file size (500MB limit for podcast episodes)
        file_size = 0
        if hasattr(file, 'size') and file.size:
            file_size = file.size
            if file_size > 500 * 1024 * 1024:  # 500MB
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="File too large. Maximum size is 500MB. For larger files, please contact support."
                )
        
        # Calculate estimated audio duration (rough estimate: 1MB ≈ 1 minute of audio)
        estimated_duration = file_size / (1024*1024) if file_size > 0 else 0
        
        logger.info(f"Starting transcription: {file.filename}")
        logger.info(f"Estimated duration: {estimated_duration:.0f} minutes" if estimated_duration > 0 else "Duration: Unknown")
        
        # Save uploaded file to temporary file
        file_extension = Path(file.filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file_path = temp_file.name
            content = await file.read()
            temp_file.write(content)
        
        # Start timing for actual processing
        start_time = time.time()
        
        # Send to Deepgram API
        deepgram_response = await transcribe_with_deepgram_api(temp_file_path, file.filename)
        
        # Extract transcript and word timestamps with speakers
        transcript, words = extract_words_with_speakers(deepgram_response)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        logger.info(f"Completed: {file.filename}")
        logger.info(f"Estimated: {estimated_duration:.0f} minutes, Actual processing: {processing_time/60:.1f} minutes")
        
        if not transcript:
            return TranscriptionResponse(
                success=False,
                error="No speech detected in the audio file"
            )
        
        # Prepare metadata
        metadata = {
            "filename": file.filename,
            "file_size": file_size,
            "file_size_mb": round(file_size / (1024*1024), 2) if file_size > 0 else 0,
            "estimated_duration_minutes": round(file_size / (1024*1024), 0) if file_size > 0 else 0,
            "model": "nova-2",
            "features": ["word_timestamps", "speaker_diarization", "smart_format", "punctuation"],
            "word_count": len(words),
            "speaker_count": len(set(w.speaker for w in words if w.speaker is not None)),
            "api_method": "REST API",
            "optimized_for": "podcast_episodes",
            "max_file_size": "500MB"
        }
        
        return TranscriptionResponse(
            success=True,
            transcript=transcript,
            words=words,
            metadata=metadata
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Transcription failed: {file.filename if file and file.filename else 'unknown'}")
        logger.error(f"Error: {str(e)}")
        
        return TranscriptionResponse(
            success=False,
            error=f"Transcription failed: {str(e)}"
        )
    
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning(f"Could not delete temporary file: {e}")

@router.post("/transcribe-url", response_model=TranscriptionResponse)
async def transcribe_audio_from_url(request: UrlTranscriptionRequest):
    """
    Transcribe audio file from URL (perfect for Firebase Storage URLs)
    
    This endpoint is designed for:
    - Firebase Storage public URLs
    - Any publicly accessible audio file URL
    - Integration with cloud storage services
    
    Perfect for workflows where audio files are already uploaded to cloud storage
    and you have a public download URL.
    """
    
    temp_file_path = None
    
    try:
        logger.info(f"Starting URL transcription: {request.file_url[:100]}...")
        
        # Download file from URL
        temp_file_path = await download_audio_from_url(
            request.file_url, 
            request.custom_filename
        )
        
        # Get file info
        file_size = os.path.getsize(temp_file_path)
        filename = request.custom_filename or "audio_from_url"
        
        # Check file size (500MB limit)
        if file_size > 500 * 1024 * 1024:  # 500MB
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Downloaded file too large. Maximum size is 500MB."
            )
        
        # Calculate estimated duration
        estimated_duration = file_size / (1024*1024) if file_size > 0 else 0
        
        logger.info(f"Downloaded file size: {file_size / (1024*1024):.1f}MB")
        logger.info(f"Estimated duration: {estimated_duration:.0f} minutes" if estimated_duration > 0 else "Duration: Unknown")
        
        # Start timing for processing
        start_time = time.time()
        
        # Send to Deepgram API
        deepgram_response = await transcribe_with_deepgram_api(temp_file_path, filename)
        
        # Extract transcript and word timestamps with speakers
        transcript, words = extract_words_with_speakers(deepgram_response)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        logger.info(f"Completed URL transcription: {filename}")
        logger.info(f"Estimated: {estimated_duration:.0f} minutes, Actual processing: {processing_time/60:.1f} minutes")
        
        if not transcript:
            return TranscriptionResponse(
                success=False,
                error="No speech detected in the audio file"
            )
        
        # Prepare metadata
        metadata = {
            "source": "url",
            "source_url": request.file_url[:100] + "..." if len(request.file_url) > 100 else request.file_url,
            "filename": filename,
            "file_size": file_size,
            "file_size_mb": round(file_size / (1024*1024), 2),
            "estimated_duration_minutes": round(file_size / (1024*1024), 0) if file_size > 0 else 0,
            "model": "nova-2",
            "features": ["word_timestamps", "speaker_diarization", "smart_format", "punctuation"],
            "word_count": len(words),
            "speaker_count": len(set(w.speaker for w in words if w.speaker is not None)),
            "api_method": "REST API",
            "optimized_for": "podcast_episodes",
            "integration": "firebase_storage_compatible"
        }
        
        return TranscriptionResponse(
            success=True,
            transcript=transcript,
            words=words,
            metadata=metadata
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"URL transcription failed: {request.file_url[:50]}...")
        logger.error(f"Error: {str(e)}")
        
        return TranscriptionResponse(
            success=False,
            error=f"URL transcription failed: {str(e)}"
        )
    
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning(f"Could not delete temporary file: {e}")

@router.get("/transcribe")
async def transcribe_info():
    """Get information about the podcast transcription service"""
    return {
        "message": "Professional podcast transcription service with word-level timestamps and speaker identification",
        "supported_formats": ["MP3", "M4A", "WAV", "FLAC", "OGG"],
        "max_file_size": "500MB", 
        "typical_episodes": {
            "30_minutes": "~30-50MB",
            "60_minutes": "~60-100MB", 
            "90_minutes": "~90-150MB",
            "2_hours": "~120-200MB"
        },
        "processing_time": {
            "small_episodes": "5-15 minutes",
            "medium_episodes": "15-45 minutes",
            "large_episodes": "45-90 minutes"
        },
        "model": "nova-2",
        "features": [
            "word_level_timestamps",
            "speaker_diarization", 
            "smart_formatting",
            "punctuation",
            "confidence_scores",
            "optimized_for_podcasts"
        ],
        "api_method": "REST API",
        "target_audience": "podcasters"
    } 