import uuid
import time
import logging
from typing import Dict, Any, Optional, List
from enum import Enum
from pydantic import BaseModel
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobStep(str, Enum):
    UPLOADING = "uploading"
    DOWNLOADING = "downloading"
    TRANSCRIBING = "transcribing"
    GENERATING_SEO = "generating_seo"
    SAVING = "saving"
    COMPLETED = "completed"

class JobInfo(BaseModel):
    job_id: str
    user_id: str
    workspace_id: Optional[str] = None
    filename: str
    upload_id: Optional[str] = None
    status: JobStatus
    current_step: JobStep
    progress: int  # 0-100
    created_at: float
    updated_at: float
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    error_message: Optional[str] = None
    result_data: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = {}

class JobManager:
    """
    Manages podcast generation jobs with persistent state tracking
    """
    
    def __init__(self):
        self.jobs: Dict[str, JobInfo] = {}
        self.user_jobs: Dict[str, List[str]] = {}  # user_id -> [job_ids]
        
    def create_job(
        self, 
        user_id: str, 
        filename: str, 
        workspace_id: Optional[str] = None,
        upload_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a new job and return job_id"""
        job_id = f"job_{uuid.uuid4().hex[:12]}_{int(time.time())}"
        current_time = time.time()
        
        job_info = JobInfo(
            job_id=job_id,
            user_id=user_id,
            workspace_id=workspace_id,
            filename=filename,
            upload_id=upload_id,
            status=JobStatus.QUEUED,
            current_step=JobStep.UPLOADING,
            progress=0,
            created_at=current_time,
            updated_at=current_time,
            metadata=metadata or {}
        )
        
        self.jobs[job_id] = job_info
        
        # Track user jobs
        if user_id not in self.user_jobs:
            self.user_jobs[user_id] = []
        self.user_jobs[user_id].append(job_id)
        
        logger.info(f"Created job {job_id} for user {user_id}, filename: {filename}")
        return job_id
    
    def get_job(self, job_id: str) -> Optional[JobInfo]:
        """Get job by ID"""
        return self.jobs.get(job_id)
    
    def get_user_jobs(self, user_id: str, active_only: bool = True) -> List[JobInfo]:
        """Get all jobs for a user"""
        user_job_ids = self.user_jobs.get(user_id, [])
        jobs = []
        
        for job_id in user_job_ids:
            if job_id in self.jobs:
                job = self.jobs[job_id]
                if not active_only or job.status in [JobStatus.QUEUED, JobStatus.PROCESSING]:
                    jobs.append(job)
        
        return jobs
    
    def update_job_status(
        self, 
        job_id: str, 
        status: JobStatus, 
        current_step: Optional[JobStep] = None,
        progress: Optional[int] = None,
        error_message: Optional[str] = None,
        result_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update job status and progress"""
        if job_id not in self.jobs:
            logger.warning(f"Job {job_id} not found for status update")
            return False
        
        job = self.jobs[job_id]
        job.status = status
        job.updated_at = time.time()
        
        if current_step:
            job.current_step = current_step
        if progress is not None:
            job.progress = progress
        if error_message:
            job.error_message = error_message
        if result_data:
            job.result_data = result_data
            
        # Set timestamps based on status
        if status == JobStatus.PROCESSING and not job.started_at:
            job.started_at = time.time()
        elif status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
            job.completed_at = time.time()
            
        logger.info(f"Updated job {job_id}: status={status}, step={current_step}, progress={progress}")
        return True
    
    def update_job_progress(self, job_id: str, current_step: JobStep, progress: int) -> bool:
        """Update job progress and current step"""
        return self.update_job_status(
            job_id=job_id,
            status=JobStatus.PROCESSING,
            current_step=current_step,
            progress=progress
        )
    
    def cancel_job(self, job_id: str, user_id: str) -> bool:
        """Cancel a job (only if owned by user)"""
        if job_id not in self.jobs:
            return False
            
        job = self.jobs[job_id]
        if job.user_id != user_id:
            logger.warning(f"User {user_id} attempted to cancel job {job_id} owned by {job.user_id}")
            return False
            
        if job.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
            logger.warning(f"Cannot cancel job {job_id} with status {job.status}")
            return False
            
        self.update_job_status(job_id, JobStatus.CANCELLED)
        logger.info(f"Job {job_id} cancelled by user {user_id}")
        return True
    
    def complete_job(self, job_id: str, result_data: Dict[str, Any]) -> bool:
        """Mark job as completed with result data"""
        return self.update_job_status(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            current_step=JobStep.COMPLETED,
            progress=100,
            result_data=result_data
        )
    
    def fail_job(self, job_id: str, error_message: str) -> bool:
        """Mark job as failed with error message"""
        return self.update_job_status(
            job_id=job_id,
            status=JobStatus.FAILED,
            error_message=error_message
        )
    
    def cleanup_old_jobs(self, max_age_hours: int = 24) -> int:
        """Clean up jobs older than max_age_hours"""
        current_time = time.time()
        cutoff_time = current_time - (max_age_hours * 3600)
        
        jobs_to_remove = []
        for job_id, job in self.jobs.items():
            if job.created_at < cutoff_time:
                jobs_to_remove.append(job_id)
        
        for job_id in jobs_to_remove:
            job = self.jobs[job_id]
            # Remove from user jobs list
            if job.user_id in self.user_jobs:
                if job_id in self.user_jobs[job.user_id]:
                    self.user_jobs[job.user_id].remove(job_id)
            # Remove job
            del self.jobs[job_id]
        
        logger.info(f"Cleaned up {len(jobs_to_remove)} old jobs")
        return len(jobs_to_remove)
    
    def is_job_cancelled(self, job_id: str) -> bool:
        """Check if job is cancelled"""
        job = self.get_job(job_id)
        return job is not None and job.status == JobStatus.CANCELLED

# Global job manager instance
job_manager = JobManager()
