// Job storage functionality removed as requested by user
// This file is kept for compatibility but no longer provides job storage features

export interface JobInfo {
  job_id: string;
  user_id: string;
  filename: string;
  created_at: number;
  workspace_id?: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  current_step: 'uploading' | 'transcribing' | 'generating' | 'saving';
  progress: number;
  updated_at: number;
  metadata: Record<string, any>;
}

// Stub functions for compatibility
export const storeJob = (job: JobInfo): void => {};
export const getStoredJobs = (): JobInfo[] => [];
export const getStoredJobsForUser = (userId: string): JobInfo[] => [];
export const updateStoredJob = (jobId: string, updates: Partial<JobInfo>): void => {};
export const removeStoredJob = (jobId: string): void => {};
export const clearStoredJobs = (): void => {};
export const hasActiveStoredJobs = (userId: string): boolean => false;
export const getActiveStoredJobs = (userId: string): JobInfo[] => [];
export const cleanupOldJobs = (): void => {};
