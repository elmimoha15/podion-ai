import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  X, 
  Loader2, 
  Clock, 
  FileAudio, 
  Sparkles, 
  Save,
  CheckCircle,
  XCircle,
  Upload,
  Download
} from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';
import { JobInfo } from '@/services/podcastApi';
import { formatDistanceToNow } from 'date-fns';

interface PersistentJobTrackerProps {
  className?: string;
}

const getStepIcon = (step: string) => {
  switch (step) {
    case 'uploading':
      return <Upload className="h-4 w-4" />;
    case 'downloading':
      return <Download className="h-4 w-4" />;
    case 'transcribing':
      return <FileAudio className="h-4 w-4" />;
    case 'generating_seo':
      return <Sparkles className="h-4 w-4" />;
    case 'saving':
      return <Save className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    default:
      return <Loader2 className="h-4 w-4 animate-spin" />;
  }
};

const getStepLabel = (step: string) => {
  switch (step) {
    case 'uploading':
      return 'Uploading file';
    case 'downloading':
      return 'Preparing audio';
    case 'transcribing':
      return 'Transcribing with AI';
    case 'generating_seo':
      return 'Generating SEO content';
    case 'saving':
      return 'Saving to database';
    case 'completed':
      return 'Processing complete';
    default:
      return 'Processing...';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'queued':
      return 'bg-blue-100 text-blue-800';
    case 'processing':
      return 'bg-orange-100 text-orange-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const JobCard: React.FC<{ 
  job: JobInfo; 
  onCancel: (jobId: string) => Promise<boolean>;
}> = ({ job, onCancel }) => {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel(job.job_id);
    } finally {
      setIsCancelling(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(job.created_at * 1000), { addSuffix: true });

  return (
    <Card className="mb-3 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-900">Generation in Progress</span>
            <Badge className={`text-xs ${getStatusColor(job.status)}`}>
              {job.status}
            </Badge>
          </div>
          {job.status === 'processing' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isCancelling}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-700 font-medium truncate">
              {job.filename}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <Clock className="h-3 w-3" />
              <span>Started {timeAgo}</span>
              <span>•</span>
              <span>Job ID: {job.job_id.slice(-8)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStepIcon(job.current_step)}
                <span className="text-sm text-gray-700">
                  {getStepLabel(job.current_step)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {job.progress}%
              </span>
            </div>
            <Progress value={job.progress} className="h-2" />
          </div>

          {job.status === 'processing' && (
            <p className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
              💡 Your content is being generated in the background. You can continue using the app - we'll notify you when it's ready!
            </p>
          )}

          {job.status === 'failed' && job.error_message && (
            <p className="text-xs text-red-700 bg-red-100 p-2 rounded">
              ❌ Generation failed: {job.error_message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const BeforeUnloadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Generation in Progress
          </DialogTitle>
          <DialogDescription>
            A generation is currently in progress. If you refresh or leave, you may lose the current session. 
            Do you want to continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Stay on page
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Leave anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const PersistentJobTracker: React.FC<PersistentJobTrackerProps> = ({ 
  className = "" 
}) => {
  const { activeJobs, cancelJob, hasActiveJobs, isLoading, isRecovering, recoveredJobs } = useJobs();
  const [showBeforeUnloadModal, setShowBeforeUnloadModal] = useState(false);
  const [pendingUnload, setPendingUnload] = useState<(() => void) | null>(null);

  // Handle beforeunload event to show modal confirmation
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasActiveJobs) {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
        setShowBeforeUnloadModal(true);
        return '';
      }
    };

    // Handle navigation attempts (for React Router)
    const handlePopState = (event: PopStateEvent) => {
      if (hasActiveJobs) {
        event.preventDefault();
        setShowBeforeUnloadModal(true);
        setPendingUnload(() => () => {
          window.history.go(-1);
        });
      }
    };

    if (hasActiveJobs) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasActiveJobs]);

  const handleConfirmLeave = () => {
    setShowBeforeUnloadModal(false);
    if (pendingUnload) {
      pendingUnload();
      setPendingUnload(null);
    }
  };

  const handleCancelLeave = () => {
    setShowBeforeUnloadModal(false);
    setPendingUnload(null);
  };

  // Show recovery state when reconnecting to jobs
  if (isRecovering) {
    return (
      <div className={`fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] ${className}`}>
        <Card className="mb-3 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <span className="font-medium text-blue-900">Reconnecting to active jobs...</span>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              💡 Checking if any generation processes are still running
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state immediately on page load to alert user
  if (isLoading && activeJobs.length === 0) {
    return (
      <div className={`fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] ${className}`}>
        <Card className="mb-3 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <span className="font-medium text-blue-900">Checking for active jobs...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasActiveJobs) {
    return (
      <>
        <BeforeUnloadModal
          isOpen={showBeforeUnloadModal}
          onClose={handleCancelLeave}
          onConfirm={handleConfirmLeave}
        />
      </>
    );
  }

  return (
    <>
      <div className={`fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] ${className}`}>
        {activeJobs.map((job) => (
          <JobCard
            key={job.job_id}
            job={job}
            onCancel={cancelJob}
          />
        ))}
      </div>

      <BeforeUnloadModal
        isOpen={showBeforeUnloadModal}
        onClose={handleCancelLeave}
        onConfirm={handleConfirmLeave}
      />
    </>
  );
};

export default PersistentJobTracker;
