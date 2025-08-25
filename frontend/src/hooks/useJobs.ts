// Job tracking functionality removed as requested by user
// This file is kept for compatibility but no longer provides job tracking features

export const useJobs = () => {
  return {
    jobs: [],
    hasActiveJobs: false,
    isLoading: false,
    isRecovering: false,
    recoveredJobs: [],
    fetchJobs: () => Promise.resolve(),
    refreshJobs: () => Promise.resolve(),
    recoverJobs: () => Promise.resolve(),
    cancelJob: () => Promise.resolve(false),
    clearAllJobs: () => {}
  };
};
