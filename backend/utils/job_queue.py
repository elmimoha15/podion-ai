"""
Async job queue system using Celery for scalable podcast processing
"""
import os
import uuid
from celery import Celery
from celery.result import AsyncResult
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

# Celery configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)

# Initialize Celery app
celery_app = Celery(
    "podion_ai_worker",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=[
        "utils.job_queue",
        "routes.podcast_workflow"
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task routing and execution
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task execution settings
    task_always_eager=False,  # Set to True for testing without Redis
    task_eager_propagates=True,
    task_ignore_result=False,
    
    # Worker settings for high concurrency
    worker_prefetch_multiplier=1,  # Prevent worker from taking too many tasks
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks
    worker_disable_rate_limits=False,
    
    # Task time limits
    task_soft_time_limit=300,  # 5 minutes soft limit
    task_time_limit=600,  # 10 minutes hard limit
    
    # Task retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_persistent=True,
    
    # Queue routing
    task_routes={
        "process_podcast_async": {"queue": "podcast_processing"},
        "transcribe_audio_async": {"queue": "transcription"},
        "generate_seo_content_async": {"queue": "seo_generation"},
        "batch_process_podcasts": {"queue": "batch_processing"},
    },
    
    # Queue priorities
    task_default_queue="default",
    task_default_exchange="default",
    task_default_routing_key="default",
)

class JobStatus:
    """Job status constants"""
    PENDING = "PENDING"
    STARTED = "STARTED"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    RETRY = "RETRY"
    REVOKED = "REVOKED"

class JobQueue:
    """High-level job queue interface for podcast processing"""
    
    def __init__(self):
        self.app = celery_app
    
    def submit_podcast_processing(
        self, 
        user_id: str,
        file_data: bytes,
        filename: str,
        workspace_id: Optional[str] = None,
        priority: int = 5
    ) -> str:
        """
        Submit podcast processing job to queue
        
        Args:
            user_id: User ID
            file_data: Audio file data
            filename: Original filename
            workspace_id: Workspace ID
            priority: Job priority (0-9, lower = higher priority)
            
        Returns:
            Job ID for tracking
        """
        job_id = str(uuid.uuid4())
        
        try:
            # Submit job to queue
            result = process_podcast_async.apply_async(
                args=[user_id, file_data, filename, workspace_id],
                task_id=job_id,
                priority=priority,
                countdown=0,  # Start immediately
                expires=3600,  # Expire after 1 hour if not processed
            )
            
            logger.info(f"Submitted podcast processing job: {job_id}")
            return job_id
            
        except Exception as e:
            logger.error(f"Failed to submit job {job_id}: {e}")
            raise
    
    def submit_batch_processing(
        self,
        user_id: str,
        file_list: List[Dict[str, Any]],
        workspace_id: Optional[str] = None,
        batch_size: int = 5
    ) -> str:
        """
        Submit batch processing job for multiple podcasts
        
        Args:
            user_id: User ID
            file_list: List of file data dictionaries
            workspace_id: Workspace ID
            batch_size: Number of files to process concurrently
            
        Returns:
            Batch job ID
        """
        batch_id = str(uuid.uuid4())
        
        try:
            result = batch_process_podcasts.apply_async(
                args=[user_id, file_list, workspace_id, batch_size],
                task_id=batch_id,
                priority=3,  # Higher priority for batch jobs
            )
            
            logger.info(f"Submitted batch processing job: {batch_id}")
            return batch_id
            
        except Exception as e:
            logger.error(f"Failed to submit batch job {batch_id}: {e}")
            raise
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get job status and progress
        
        Args:
            job_id: Job ID
            
        Returns:
            Job status information
        """
        try:
            result = AsyncResult(job_id, app=self.app)
            
            status_info = {
                "job_id": job_id,
                "status": result.status,
                "ready": result.ready(),
                "successful": result.successful() if result.ready() else None,
                "failed": result.failed() if result.ready() else None,
                "progress": None,
                "result": None,
                "error": None,
                "created_at": None,
                "completed_at": None,
            }
            
            # Get detailed info if available
            if result.info:
                if isinstance(result.info, dict):
                    status_info.update(result.info)
                elif isinstance(result.info, Exception):
                    status_info["error"] = str(result.info)
            
            # Get result if completed successfully
            if result.ready() and result.successful():
                status_info["result"] = result.result
            
            return status_info
            
        except Exception as e:
            logger.error(f"Failed to get job status for {job_id}: {e}")
            return {
                "job_id": job_id,
                "status": JobStatus.FAILURE,
                "error": f"Failed to get job status: {e}"
            }
    
    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a job
        
        Args:
            job_id: Job ID to cancel
            
        Returns:
            True if cancelled successfully
        """
        try:
            self.app.control.revoke(job_id, terminate=True)
            logger.info(f"Cancelled job: {job_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to cancel job {job_id}: {e}")
            return False
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """
        Get queue statistics
        
        Returns:
            Queue statistics
        """
        try:
            inspect = self.app.control.inspect()
            
            # Get active tasks
            active = inspect.active()
            scheduled = inspect.scheduled()
            reserved = inspect.reserved()
            
            stats = {
                "active_tasks": sum(len(tasks) for tasks in (active or {}).values()),
                "scheduled_tasks": sum(len(tasks) for tasks in (scheduled or {}).values()),
                "reserved_tasks": sum(len(tasks) for tasks in (reserved or {}).values()),
                "workers_online": len(active or {}),
                "queues": {
                    "podcast_processing": 0,
                    "transcription": 0,
                    "seo_generation": 0,
                    "batch_processing": 0,
                }
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get queue stats: {e}")
            return {"error": str(e)}

# Global job queue instance
job_queue = JobQueue()

# Celery tasks
@celery_app.task(bind=True, name="process_podcast_async")
def process_podcast_async(self, user_id: str, file_data: bytes, filename: str, workspace_id: Optional[str] = None):
    """
    Async task for processing podcast
    """
    try:
        # Update task status
        self.update_state(
            state=JobStatus.STARTED,
            meta={
                "progress": 0,
                "stage": "initializing",
                "message": "Starting podcast processing"
            }
        )
        
        # Import here to avoid circular imports
        from routes.podcast_workflow import process_complete_workflow
        
        # Process the podcast
        result = process_complete_workflow(
            user_id=user_id,
            file_data=file_data,
            filename=filename,
            workspace_id=workspace_id,
            task_instance=self  # Pass task instance for progress updates
        )
        
        return {
            "status": JobStatus.SUCCESS,
            "result": result,
            "completed_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Podcast processing failed: {e}")
        self.update_state(
            state=JobStatus.FAILURE,
            meta={
                "error": str(e),
                "failed_at": datetime.utcnow().isoformat()
            }
        )
        raise

@celery_app.task(bind=True, name="batch_process_podcasts")
def batch_process_podcasts(self, user_id: str, file_list: List[Dict], workspace_id: Optional[str] = None, batch_size: int = 5):
    """
    Async task for batch processing multiple podcasts
    """
    try:
        self.update_state(
            state=JobStatus.STARTED,
            meta={
                "progress": 0,
                "total_files": len(file_list),
                "processed_files": 0,
                "stage": "batch_processing"
            }
        )
        
        results = []
        processed = 0
        
        # Process files in batches
        for i in range(0, len(file_list), batch_size):
            batch = file_list[i:i + batch_size]
            batch_results = []
            
            # Process batch concurrently
            for file_info in batch:
                try:
                    job_id = job_queue.submit_podcast_processing(
                        user_id=user_id,
                        file_data=file_info["data"],
                        filename=file_info["filename"],
                        workspace_id=workspace_id,
                        priority=2  # Higher priority for batch items
                    )
                    batch_results.append({"filename": file_info["filename"], "job_id": job_id})
                    
                except Exception as e:
                    batch_results.append({"filename": file_info["filename"], "error": str(e)})
            
            results.extend(batch_results)
            processed += len(batch)
            
            # Update progress
            progress = int((processed / len(file_list)) * 100)
            self.update_state(
                state=JobStatus.PROCESSING,
                meta={
                    "progress": progress,
                    "total_files": len(file_list),
                    "processed_files": processed,
                    "stage": "batch_processing"
                }
            )
        
        return {
            "status": JobStatus.SUCCESS,
            "results": results,
            "total_processed": processed,
            "completed_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Batch processing failed: {e}")
        self.update_state(
            state=JobStatus.FAILURE,
            meta={
                "error": str(e),
                "failed_at": datetime.utcnow().isoformat()
            }
        )
        raise

# Convenience functions
def submit_podcast_job(user_id: str, file_data: bytes, filename: str, workspace_id: Optional[str] = None) -> str:
    """Submit podcast processing job"""
    return job_queue.submit_podcast_processing(user_id, file_data, filename, workspace_id)

def get_job_status(job_id: str) -> Dict[str, Any]:
    """Get job status"""
    return job_queue.get_job_status(job_id)

def cancel_job(job_id: str) -> bool:
    """Cancel job"""
    return job_queue.cancel_job(job_id)
