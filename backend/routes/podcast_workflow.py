from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status, BackgroundTasks, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import os
import logging
import time
from pathlib import Path
import asyncio
import uuid

# Import our existing utilities and services
from utils.firebase_storage import upload_audio_file_streaming
from utils.firebase_firestore import save_complete_podcast_workflow
from routes.deepgram_transcription import transcribe_with_deepgram_api, extract_words_with_speakers, validate_audio_file
from routes.gemini_seo import generate_seo_content_with_gemini, SEOGenerationRequest

# Import scalability components
from utils.monitoring import monitor_performance, metrics_collector
from utils.circuit_breaker import resilient_call, fallback_handler
from utils.connection_pool import get_http_client, cached_operation
from utils.rate_limiter import rate_limit
from utils.job_queue import job_queue

from slowapi import Limiter
from slowapi.util import get_remote_address

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Pydantic models
class WorkflowResponse(BaseModel):
    success: bool
    doc_id: Optional[str] = None
    processing_time: Optional[float] = None
    steps_completed: Optional[Dict[str, bool]] = None
    storage_info: Optional[Dict[str, Any]] = None
    transcription_info: Optional[Dict[str, Any]] = None
    seo_info: Optional[Dict[str, Any]] = None
    firestore_info: Optional[Dict[str, Any]] = None
    saved_document: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class QuickUploadResponse(BaseModel):
    success: bool
    upload_id: Optional[str] = None
    job_id: Optional[str] = None
    message: Optional[str] = None
    storage_info: Optional[Dict[str, Any]] = None
    processing_started: Optional[bool] = None
    error: Optional[str] = None

class WorkflowStep:
    """Track workflow step completion"""
    def __init__(self):
        self.upload = False
        self.transcription = False
        self.seo_generation = False
        self.firestore_save = False

@monitor_performance(stage="upload_to_storage")
@resilient_call(service_name="firebase")
async def step_1_upload_to_storage(file: UploadFile, user_id: str) -> Dict[str, Any]:
    """
    Step 1: Upload audio file to Firebase Storage with resilience
    
    Returns: storage_path, public_url, file_size, filename
    """
    try:
        step_start_time = time.time()
        
        logger.info(f"🚀 Step 1: Uploading {file.filename} to Firebase Storage for user {user_id}")
        
        # Check cache for recent upload
        cache_key = f"upload:{user_id}:{file.filename}:{file.size}"
        async with cached_operation(cache_key, "upload_data", ttl=300) as cache_context:
            if hasattr(cache_context, 'result') and cache_context.result:
                logger.info(f"📦 Using cached upload result for {file.filename}")
                return cache_context.result
            
            # Upload to Firebase Storage using fast streaming method
            storage_path, public_url = upload_audio_file_streaming(
                file=file,
                user_id=user_id
            )
            
            # Get file size from uploaded file info
            from utils.firebase_storage import get_file_info
            file_info = get_file_info(storage_path)
            file_size = file_info.get("size", 0)
            
            step_duration = time.time() - step_start_time
            
            result = {
                "storage_path": storage_path,
                "public_url": public_url,
                "file_size": file_size,
                "filename": os.path.basename(storage_path),
                "original_filename": file.filename,
                "upload_duration_seconds": step_duration
            }
            
            # Cache the result
            if hasattr(cache_context, 'set_result'):
                await cache_context.set_result(result)
            
            logger.info(f"✅ Step 1 Complete: File uploaded to {storage_path} in {step_duration:.2f} seconds")
            return result
        
    except Exception as e:
        logger.error(f"❌ Step 1 Failed: {str(e)}")
        # Record error metrics
        await metrics_collector.record_processing_metrics(
            stage="upload_to_storage",
            duration=time.time() - step_start_time,
            success=False,
            error_type=type(e).__name__
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload step failed: {str(e)}"
        )

@monitor_performance(stage="transcribe_audio")
@resilient_call(service_name="deepgram")
async def step_2_transcribe_audio(file: UploadFile, filename: str) -> Dict[str, Any]:
    """
    Step 2: Transcribe audio using Deepgram Nova-2 with resilience
    
    Returns: transcript, words, metadata
    """
    try:
        logger.info(f"🎙️ Step 2: Transcribing {filename} with Deepgram Nova-2")
        
        # Save file to temporary location for Deepgram
        import tempfile
        file_extension = Path(filename).suffix
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Check cache for recent transcription
            cache_key = f"transcription:{filename}:{file.size}"
            async with cached_operation(cache_key, "transcription_data", ttl=3600) as cache_context:
                if hasattr(cache_context, 'result') and cache_context.result:
                    logger.info(f"📦 Using cached transcription for {filename}")
                    return cache_context.result
                
                # Transcribe with Deepgram using HTTP client pool
                http_client = await get_http_client("deepgram")
                deepgram_response = await transcribe_with_deepgram_api(temp_file_path, filename)
            
            # Extract transcript and words
            transcript, words = extract_words_with_speakers(deepgram_response)
            
            # Convert word objects to dictionaries
            words_data = []
            for word in words:
                if hasattr(word, 'dict'):
                    words_data.append(word.dict())
                elif isinstance(word, dict):
                    words_data.append(word)
                else:
                    words_data.append({
                        "word": getattr(word, 'word', ''),
                        "start": getattr(word, 'start', 0.0),
                        "end": getattr(word, 'end', 0.0),
                        "confidence": getattr(word, 'confidence', 0.0),
                        "speaker": getattr(word, 'speaker', None)
                    })
            
            result = {
                "transcript": transcript,
                "words": words_data,
                "word_count": len(words_data),
                "speakers_detected": len(set(w.get("speaker") for w in words_data if w.get("speaker") is not None)),
                "model": "nova-2",
                "features": ["word_timestamps", "speaker_diarization", "smart_format", "punctuation"]
            }
            
            logger.info(f"✅ Step 2 Complete: Transcribed {len(words_data)} words, {result['speakers_detected']} speakers")
            return result
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        
    except Exception as e:
        logger.error(f"❌ Step 2 Failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription step failed: {str(e)}"
        )

@monitor_performance(stage="generate_seo_content")
@resilient_call(service_name="gemini")
async def step_3_generate_seo_content(transcript: str, filename: str, words_data: list) -> Dict[str, Any]:
    """
    Step 3: Generate SEO content using Gemini 1.5 Pro with resilience
    
    Returns: seo_title, show_notes, blog_post, social_media, metadata
    """
    try:
        logger.info(f"✨ Step 3: Generating SEO content for {filename} using Gemini 1.5 Pro")
        
        # Check cache for recent SEO generation
        import hashlib
        transcript_hash = hashlib.md5(transcript.encode()).hexdigest()[:16]
        cache_key = f"seo:{transcript_hash}:{filename}"
        
        async with cached_operation(cache_key, "seo_data", ttl=7200) as cache_context:
            if hasattr(cache_context, 'result') and cache_context.result:
                logger.info(f"📦 Using cached SEO content for {filename}")
                return cache_context.result
            
            # Generate SEO content with Gemini using HTTP client pool
            http_client = await get_http_client("gemini")
            seo_request = SEOGenerationRequest(
                transcript=transcript,
                filename=filename,
                words_data=words_data
            )
            
            seo_response = await generate_seo_content_with_gemini(seo_request)
        
        result = {
            "seo_title": seo_response.get("seo_title", ""),
            "show_notes": seo_response.get("show_notes", []),
            "blog_post": seo_response.get("blog_post", {}),
            "social_media": seo_response.get("social_media", {}),
            "generation_metadata": {
                "model": "gemini-1.5-pro",
                "transcript_length": len(transcript),
                "show_notes_count": len(seo_response.get("show_notes", [])),
                "blog_post_word_count": len(seo_response.get("blog_post", {}).get("body", "").split()),
                "social_platforms": len(seo_response.get("social_media", {}))
            }
        }
        
        logger.info(f"✅ Step 3 Complete: Generated SEO content with {len(result['show_notes'])} show notes")
        return result
        
    except Exception as e:
        logger.error(f"❌ Step 3 Failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SEO generation step failed: {str(e)}"
        )

@monitor_performance(stage="save_to_firestore")
@resilient_call(service_name="firebase")
async def step_4_save_to_firestore(
    user_id: str,
    filename: str,
    audio_url: str,
    storage_path: str,
    file_size: int,
    transcription_data: Dict[str, Any],
    seo_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Step 4: Save complete workflow results to Firestore
    
    Returns: doc_id, saved_document
    """
    try:
        logger.info(f"💾 Step 4: Saving complete workflow to Firestore for user {user_id}")
        
        # Prepare transcript response format
        transcript_response = {
            "success": True,
            "transcript": transcription_data["transcript"],
            "words": transcription_data["words"],
            "metadata": {
                "word_count": transcription_data["word_count"],
                "speakers_detected": transcription_data["speakers_detected"],
                "model": transcription_data["model"],
                "features": transcription_data["features"]
            }
        }
        
        # Prepare SEO response format
        seo_response = {
            "success": True,
            "seo_title": seo_data["seo_title"],
            "show_notes": seo_data["show_notes"],
            "blog_post": seo_data["blog_post"],
            "social_media": seo_data["social_media"],
            "metadata": seo_data["generation_metadata"]
        }
        
        # Save to Firestore
        doc_id = save_complete_podcast_workflow(
            user_id=user_id,
            filename=filename,
            audio_url=audio_url,
            storage_path=storage_path,
            file_size=file_size,
            transcript_response=transcript_response,
            seo_response=seo_response
        )
        
        # Get the saved document to return
        from utils.firebase_firestore import get_podcast_metadata
        saved_document = get_podcast_metadata(doc_id)
        
        result = {
            "doc_id": doc_id,
            "saved_document": saved_document,
            "collection": "podcasts"
        }
        
        logger.info(f"✅ Step 4 Complete: Saved to Firestore with doc_id: {doc_id}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Step 4 Failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Firestore save step failed: {str(e)}"
        )

async def process_workflow_background(
    job_id: str,
    upload_id: str,
    storage_path: str,
    public_url: str,
    file_size: int,
    filename: str,
    user_id: str,
    workspace_id: str = None
):
    """
    Background task to process the complete workflow after upload with job tracking
    """
    try:
        processing_start_time = time.time()
        logger.info(f"🔄 Background processing started for job_id: {job_id}, upload_id: {upload_id}")
        
        # Processing started
        
        # Create temporary file for transcription
        download_start_time = time.time()
        import tempfile
        import requests
        
        file_extension = Path(filename).suffix
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            # Download file from storage for processing
            response = requests.get(public_url)
            temp_file.write(response.content)
            temp_file_path = temp_file.name
        
        download_time = time.time() - download_start_time
        logger.info(f"📥 File downloaded for processing in {download_time:.2f} seconds")
        
        try:
            # Step 2: Transcription
            transcription_start_time = time.time()
            logger.info(f"🎙️ Background Step 2: Transcribing {filename}")
            deepgram_response = await transcribe_with_deepgram_api(temp_file_path, filename)
            transcript, words = extract_words_with_speakers(deepgram_response)
            
            # Convert word objects to dictionaries
            words_data = []
            for word in words:
                if hasattr(word, 'dict'):
                    words_data.append(word.dict())
                elif isinstance(word, dict):
                    words_data.append(word)
                else:
                    words_data.append({
                        "word": getattr(word, 'word', ''),
                        "start": getattr(word, 'start', 0.0),
                        "end": getattr(word, 'end', 0.0),
                        "confidence": getattr(word, 'confidence', 0.0),
                        "speaker": getattr(word, 'speaker', None)
                    })
            
            transcription_time = time.time() - transcription_start_time
            
            transcription_data = {
                "transcript": transcript,
                "words": words_data,
                "word_count": len(words_data),
                "speakers_detected": len(set(w.get("speaker") for w in words_data if w.get("speaker") is not None)),
                "model": "nova-2",
                "processing_time_seconds": transcription_time
            }
            
            logger.info(f"✅ Step 2 Complete: Transcribed {len(words_data)} words in {transcription_time:.2f} seconds")
            
            # Step 3: SEO Generation
            seo_start_time = time.time()
            logger.info(f"✨ Background Step 3: Generating SEO content for {filename}")
            seo_request = SEOGenerationRequest(transcript=transcript, podcast_title=filename)
            gemini_result = await generate_seo_content_with_gemini(seo_request)
            
            seo_time = time.time() - seo_start_time
            
            seo_data = {
                "seo_title": gemini_result.get("seo_title", ""),
                "show_notes": gemini_result.get("show_notes", []),
                "blog_post": gemini_result.get("blog_post", {}),
                "social_media": gemini_result.get("social_media", {}),
                "generation_metadata": {
                    "model": "gemini-1.5-pro",
                    "transcript_length": len(transcript),
                    "processing_time_seconds": seo_time
                }
            }
            
            logger.info(f"✅ Step 3 Complete: Generated SEO content in {seo_time:.2f} seconds")
            
            # Step 4: Save to Firestore
            firestore_start_time = time.time()
            logger.info(f"💾 Background Step 4: Saving to Firestore")
            
            # Add upload_id to transcription_data for tracking
            if 'metadata' not in transcription_data:
                transcription_data['metadata'] = {}
            transcription_data['metadata']['upload_id'] = upload_id
            
            doc_id = save_complete_podcast_workflow(
                user_id=user_id,
                filename=filename,
                audio_url=public_url,
                storage_path=storage_path,
                file_size=file_size,
                transcript_response=transcription_data,
                seo_response=seo_data,
                workspace_id=workspace_id
            )
            
            firestore_time = time.time() - firestore_start_time
            total_processing_time = time.time() - processing_start_time
            
            logger.info(f"✅ Step 4 Complete: Saved to Firestore in {firestore_time:.2f} seconds")
            logger.info(f"🎉 Background processing completed for upload_id: {upload_id}, doc_id: {doc_id}")
            logger.info(f"⏱️  Total processing time: {total_processing_time:.2f} seconds")
            logger.info(f"📊 Processing breakdown: Download: {download_time:.1f}s | Transcription: {transcription_time:.1f}s | SEO: {seo_time:.1f}s | Save: {firestore_time:.1f}s")
            
            # Processing completed successfully
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        logger.error(f"❌ Background processing failed for upload_id: {upload_id}, error: {str(e)}")
        
        # Processing failed
        
    except Exception as e:
        logger.error(f"❌ Quick upload failed: {str(e)}")
        return QuickUploadResponse(
            success=False,
            error=f"Quick upload failed: {str(e)}"
        )

@router.post("/quick-upload-and-process")
async def quick_upload_and_process(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Form(...),
    workspace_id: Optional[str] = Form(None)
) -> QuickUploadResponse:
    """
    Quick upload and process endpoint with job management
    Uploads file and starts background processing with unique job_id
    """
    try:
        logger.info(f"🚀 Quick upload started for user: {user_id}, file: {file.filename}")
        
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        # Validate audio file
        validation_result = validate_audio_file(file)
        if not validation_result["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=validation_result["error"]
            )
        
        # Upload file to Firebase Storage
        storage_path, public_url = upload_audio_file_streaming(
            file=file,
            user_id=user_id,
            custom_filename=file.filename
        )
        
        # Generate upload_id from storage path
        upload_id = storage_path.split('/')[-1].split('.')[0]  # Extract filename without extension
        
        # Get file size
        file_size = 0
        if hasattr(file, 'size') and file.size:
            file_size = file.size
        else:
            # Fallback: read file to get size
            content = await file.read()
            file_size = len(content)
            await file.seek(0)  # Reset file pointer
        
        # Generate unique job_id for tracking
        job_id = str(uuid.uuid4())
        
        logger.info(f"✅ Processing started with ID: {job_id}")
        
        # Start background processing
        background_tasks.add_task(
            process_workflow_background,
            job_id=job_id,
            upload_id=upload_id,
            storage_path=storage_path,
            public_url=public_url,
            file_size=file_size,
            filename=file.filename or "unknown",
            user_id=user_id,
            workspace_id=workspace_id
        )
        
        return QuickUploadResponse(
            success=True,
            upload_id=upload_id,
            job_id=job_id,
            message="File uploaded successfully! Processing started in background.",
            processing_started=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Quick upload failed: {str(e)}")
        return QuickUploadResponse(
            success=False,
            error=f"Quick upload failed: {str(e)}"
        )

@router.get("/workflow")
async def workflow_service_info():
    """Get information about the complete podcast processing workflow"""
    return {
        "message": "Complete podcast processing workflow - Upload → Transcribe → Generate → Save",
        "endpoint": "POST /process-podcast",
        "workflow_steps": {
            "1_upload": {
                "service": "Firebase Storage",
                "action": "Upload audio file and get public URL",
                "output": "storage_path, public_url, file_size"
            },
            "2_transcribe": {
                "service": "Deepgram Nova-2",
                "action": "Transcribe with word timestamps and speaker diarization",
                "output": "transcript, words[], speakers_detected"
            },
            "3_generate": {
                "service": "Gemini 1.5 Pro", 
                "action": "Generate complete SEO content suite",
                "output": "seo_title, show_notes, blog_post, social_media"
            },
            "4_save": {
                "service": "Firebase Firestore",
                "action": "Save complete podcast metadata",
                "output": "doc_id, saved_document"
            }
        },
        "input_requirements": {
            "file": "Audio file (MP3, M4A, WAV, FLAC, OGG) up to 500MB",
            "user_id": "User identifier for organization"
        },
        "processing_time": {
            "small_episodes": "5-15 minutes (under 30 mins audio)",
            "medium_episodes": "15-45 minutes (30-90 mins audio)", 
            "large_episodes": "45-90 minutes (90+ mins audio)"
        },
        "output_includes": [
            "Complete Firestore document with all data",
            "Storage URLs for audio file access",
            "Full transcript with word-level timestamps",
            "Speaker diarization results",
            "SEO-optimized titles and descriptions",
            "Timestamped show notes",
            "Complete blog post with headings",
            "Social media content for 4 platforms",
            "Processing metadata and statistics"
        ],
        "perfect_for": [
            "Podcasters who want end-to-end processing",
            "Content creators needing SEO optimization",
            "Shows requiring speaker identification",
            "Teams building podcast management systems",
            "Automated content workflows"
        ],
        "error_handling": "Partial completion tracking - see which steps succeeded",
        "scalability": "Handles enterprise podcast processing volumes"
    }

 