from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import os
import logging
import time
from pathlib import Path
import asyncio

# Import our existing utilities and services
from utils.firebase_storage import upload_audio_file_streaming
from utils.firebase_firestore import save_complete_podcast_workflow
from routes.deepgram_transcription import transcribe_with_deepgram_api, extract_words_with_speakers, validate_audio_file
from routes.gemini_seo import generate_seo_content_with_gemini, SEOGenerationRequest

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

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

async def step_1_upload_to_storage(file: UploadFile, user_id: str) -> Dict[str, Any]:
    """
    Step 1: Upload audio file to Firebase Storage
    
    Returns: storage_path, public_url, file_size, filename
    """
    try:
        step_start_time = time.time()
        
        logger.info(f"🚀 Step 1: Uploading {file.filename} to Firebase Storage for user {user_id}")
        
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
        
        logger.info(f"✅ Step 1 Complete: File uploaded to {storage_path} in {step_duration:.2f} seconds")
        return result
        
    except Exception as e:
        logger.error(f"❌ Step 1 Failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload step failed: {str(e)}"
        )

async def step_2_transcribe_audio(file: UploadFile, filename: str) -> Dict[str, Any]:
    """
    Step 2: Transcribe audio using Deepgram Nova-2
    
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
            # Transcribe with Deepgram
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

async def step_3_generate_seo_content(transcript: str, filename: str, words_data: list) -> Dict[str, Any]:
    """
    Step 3: Generate SEO content using Gemini 1.5 Pro
    
    Returns: seo_title, show_notes, blog_post, social_media, metadata
    """
    try:
        logger.info(f"✨ Step 3: Generating SEO content for {filename} using Gemini 1.5 Pro")
        
        # Create SEO generation request
        seo_request = SEOGenerationRequest(
            transcript=transcript,
            podcast_title=filename
        )
        
        # Generate SEO content
        gemini_result = await generate_seo_content_with_gemini(seo_request)
        
        result = {
            "seo_title": gemini_result.get("seo_title", ""),
            "show_notes": gemini_result.get("show_notes", []),
            "blog_post": gemini_result.get("blog_post", {}),
            "social_media": gemini_result.get("social_media", {}),
            "generation_metadata": {
                "model": "gemini-1.5-pro",
                "transcript_length": len(transcript),
                "show_notes_count": len(gemini_result.get("show_notes", [])),
                "blog_post_word_count": len(gemini_result.get("blog_post", {}).get("body", "").split()),
                "social_platforms": len(gemini_result.get("social_media", {}))
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
    upload_id: str,
    storage_path: str,
    public_url: str,
    file_size: int,
    filename: str,
    user_id: str,
    workspace_id: str = None
):
    """
    Background task to process the complete workflow after upload
    """
    try:
        processing_start_time = time.time()
        logger.info(f"🔄 Background processing started for upload_id: {upload_id}")
        
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
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        logger.error(f"❌ Background processing failed for upload_id: {upload_id}, error: {str(e)}")

@router.post("/process-podcast", response_model=WorkflowResponse)
async def process_complete_podcast_workflow(
    file: UploadFile = File(..., description="Podcast audio file (MP3, M4A, WAV, FLAC, OGG) - up to 500MB"),
    user_id: str = Form(..., description="User ID for organizing the podcast")
):
    """
    Complete Podcast Processing Workflow
    
    This endpoint orchestrates the entire podcast processing pipeline:
    
    1. **Upload** → Firebase Storage (get public URL)
    2. **Transcribe** → Deepgram Nova-2 (word timestamps + speakers)  
    3. **Generate** → Gemini 1.5 Pro (SEO content suite)
    4. **Save** → Firestore (complete metadata)
    
    Perfect for podcasters who want a single API call to:
    - Store their audio file securely in the cloud
    - Get a professional transcript with speaker identification
    - Generate viral SEO content for all platforms
    - Save everything for easy retrieval and management
    
    **Processing Time:** 5-90 minutes depending on episode length
    **Max File Size:** 500MB (supports 2+ hour episodes)
    **Output:** Complete podcast document with all processed data
    """
    
    workflow_start_time = time.time()
    steps = WorkflowStep()
    
    # Initialize result containers
    storage_info = {}
    transcription_info = {}
    seo_info = {}
    firestore_info = {}
    
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
                detail="Unsupported file format. Supported: MP3, M4A, WAV, FLAC, OGG"
            )
        
        logger.info(f"🚀 Starting complete podcast workflow for user {user_id}: {file.filename}")
        
        # Step 1: Upload to Firebase Storage
        storage_info = await step_1_upload_to_storage(file, user_id)
        steps.upload = True
        
        # Step 2: Transcribe with Deepgram
        await file.seek(0)  # Reset file pointer
        transcription_info = await step_2_transcribe_audio(file, storage_info["original_filename"])
        steps.transcription = True
        
        # Step 3: Generate SEO content with Gemini
        seo_info = await step_3_generate_seo_content(
            transcript=transcription_info["transcript"],
            filename=storage_info["original_filename"],
            words_data=transcription_info["words"]
        )
        steps.seo_generation = True
        
        # Step 4: Save everything to Firestore
        firestore_info = await step_4_save_to_firestore(
            user_id=user_id,
            filename=storage_info["original_filename"],
            audio_url=storage_info["public_url"],
            storage_path=storage_info["storage_path"],
            file_size=storage_info["file_size"],
            transcription_data=transcription_info,
            seo_data=seo_info
        )
        steps.firestore_save = True
        
        # Calculate total processing time
        total_processing_time = time.time() - workflow_start_time
        
        logger.info(f"🎉 Complete workflow finished successfully in {total_processing_time/60:.1f} minutes")
        logger.info(f"📄 Document ID: {firestore_info['doc_id']}")
        
        return WorkflowResponse(
            success=True,
            doc_id=firestore_info["doc_id"],
            processing_time=round(total_processing_time, 2),
            steps_completed={
                "upload": steps.upload,
                "transcription": steps.transcription,
                "seo_generation": steps.seo_generation,
                "firestore_save": steps.firestore_save
            },
            storage_info=storage_info,
            transcription_info={
                "transcript_length": len(transcription_info["transcript"]),
                "word_count": transcription_info["word_count"],
                "speakers_detected": transcription_info["speakers_detected"],
                "model": transcription_info["model"]
            },
            seo_info={
                "seo_title": seo_info["seo_title"],
                "show_notes_count": len(seo_info["show_notes"]),
                "blog_post_generated": bool(seo_info["blog_post"]),
                "social_platforms": len(seo_info["social_media"])
            },
            firestore_info={
                "doc_id": firestore_info["doc_id"],
                "collection": "podcasts"
            },
            saved_document=firestore_info["saved_document"]
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"💥 Workflow failed: {str(e)}")
        
        # Calculate partial processing time
        partial_time = time.time() - workflow_start_time
        
        return WorkflowResponse(
            success=False,
            processing_time=round(partial_time, 2),
            steps_completed={
                "upload": steps.upload,
                "transcription": steps.transcription,
                "seo_generation": steps.seo_generation,
                "firestore_save": steps.firestore_save
            },
            storage_info=storage_info if storage_info else None,
            transcription_info=transcription_info if transcription_info else None,
            seo_info=seo_info if seo_info else None,
            firestore_info=firestore_info if firestore_info else None,
            error=f"Workflow failed: {str(e)}"
        )

@router.post("/quick-upload", response_model=QuickUploadResponse)
async def quick_upload_and_process(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Podcast audio file - upload happens immediately, processing in background"),
    user_id: str = Form(..., description="User ID for organizing the podcast"),
    workspace_id: str = Form(None, description="Workspace ID to organize the podcast (optional)")
):
    """
    🚀 FASTEST UPLOAD METHOD: Upload immediately, process in background
    
    This endpoint:
    1. Uploads your file to storage immediately (returns in seconds)
    2. Starts background processing (transcription, SEO generation, etc.)
    3. You can check status or results later
    
    Perfect for large files - no more waiting!
    """
    try:
        upload_id = f"upload_{int(time.time())}_{user_id}"
        
        logger.info(f"🚀 Quick upload started for {file.filename}, upload_id: {upload_id}")
        
        # Step 1: Fast upload only
        upload_result = await step_1_upload_to_storage(file, user_id)
        
        # Add background task for processing
        background_tasks.add_task(
            process_workflow_background,
            upload_id=upload_id,
            storage_path=upload_result["storage_path"],
            public_url=upload_result["public_url"],
            file_size=upload_result["file_size"],
            filename=upload_result["filename"],
            user_id=user_id,
            workspace_id=workspace_id
        )
        
        logger.info(f"✅ Quick upload completed, background processing started for upload_id: {upload_id}")
        
        return QuickUploadResponse(
            success=True,
            upload_id=upload_id,
            message="File uploaded successfully! Processing started in background.",
            storage_info={
                "storage_path": upload_result["storage_path"],
                "public_url": upload_result["public_url"],
                "file_size": upload_result["file_size"],
                "filename": upload_result["filename"]
            },
            processing_started=True
        )
        
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