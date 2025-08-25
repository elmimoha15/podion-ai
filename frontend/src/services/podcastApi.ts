import { auth } from '../lib/firebase';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface PodcastUploadResponse {
  success: boolean;
  upload_id?: string;
  job_id?: string;
  message?: string;
  storage_info?: {
    storage_path: string;
    public_url: string;
    file_size: number;
    filename: string;
  };
  processing_started?: boolean;
  error?: string;
}

export interface WorkflowResponse {
  success: boolean;
  doc_id?: string;
  processing_time?: number;
  steps_completed?: {
    upload: boolean;
    transcription: boolean;
    seo_generation: boolean;
    firestore_save: boolean;
  };
  storage_info?: any;
  transcription_info?: any;
  seo_info?: any;
  firestore_info?: any;
  saved_document?: any;
  error?: string;
}

export interface PodcastDocument {
  id: string;
  user_id: string;
  workspace_id?: string;
  filename: string;
  original_filename: string;
  audio_url: string;
  storage_path: string;
  file_size: number;
  duration?: number;
  created_at: string;
  updated_at: string;
  processing_status: 'uploading' | 'transcribing' | 'generating' | 'complete' | 'error';
  transcription?: {
    transcript: string;
    words: any[];
    speakers_detected: number;
    language: string;
    confidence: number;
  };
  seo_content?: {
    seo_title: string;
    seo_description: string;
    keywords: string[];
    show_notes: string;
    blog_post: string;
    social_media: {
      twitter: string;
      linkedin: string;
      instagram: string;
      facebook: string;
    };
  };
  metadata?: any;
}

class PodcastApiService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const idToken = await user.getIdToken();
    return {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async getAuthHeadersForFormData(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const idToken = await user.getIdToken();
    return {
      'Authorization': `Bearer ${idToken}`,
    };
  }

  async quickUploadAndProcess(file: File, userId: string, workspaceId?: string): Promise<PodcastUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);
      if (workspaceId) {
        formData.append('workspace_id', workspaceId);
      }

      const headers = await this.getAuthHeadersForFormData();

      const response = await fetch(`${API_BASE_URL}/quick-upload-and-process`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Quick upload error:', error);
      throw error;
    }
  }

  async processCompleteWorkflow(file: File, userId: string): Promise<WorkflowResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);

      const headers = await this.getAuthHeadersForFormData();

      const response = await fetch(`${API_BASE_URL}/podcast-workflow/process-podcast`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Processing failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Complete workflow error:', error);
      throw error;
    }
  }

  // Job management methods removed as requested by user

  async getPodcastById(podcastId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/firestore/podcast/${podcastId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch podcast: ${response.status}`);
      }

      const result = await response.json();
      return result.podcast_data;
    } catch (error) {
      console.error('Error fetching podcast:', error);
      throw error;
    }
  }

  async getPodcastByUploadId(uploadId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/firestore/podcast/upload/${uploadId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch podcast by upload ID: ${response.status}`);
      }

      const result = await response.json();
      return result.podcast_data;
    } catch (error) {
      console.error('Error fetching podcast by upload ID:', error);
      throw error;
    }
  }

  async getWorkspaceEpisodes(workspaceId: string): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/firestore/podcasts/workspace/${workspaceId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workspace episodes: ${response.status}`);
      }

      const result = await response.json();
      return result.podcasts || [];
    } catch (error) {
      console.error('Error fetching workspace episodes:', error);
      throw error;
    }
  }

  async deletePodcast(podcastId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/firestore/podcast/${podcastId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete podcast: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting podcast:', error);
      throw error;
    }
  }

  async getUserPodcasts(userId: string, limit: number = 50): Promise<PodcastDocument[]> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${API_BASE_URL}/firestore/podcasts/user/${userId}?limit=${limit}`;

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch podcasts: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result.podcasts || [];
    } catch (error) {
      console.error('Get podcasts error:', error);
      throw error;
    }
  }

  async getWorkflowInfo(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/podcast-workflow/workflow`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch workflow info: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get workflow info error:', error);
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/firestore/podcasts/stats/${userId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch user stats: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  async getRecentEpisodes(userId: string, limit: number = 5): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/firestore/podcasts/user/${userId}?limit=${limit}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch recent episodes: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result.podcasts || [];
    } catch (error) {
      console.error('Get recent episodes error:', error);
      throw error;
    }
  }

  // Billing and Usage Tracking Methods
  async getUserUsage(userId: string, periodDays: number = 30): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/usage/${userId}?period_days=${periodDays}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch user usage: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get user usage error:', error);
      throw error;
    }
  }

  async getBillingHistory(userId: string, limit: number = 12): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/billing-history/${userId}?limit=${limit}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch billing history: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get billing history error:', error);
      throw error;
    }
  }

  async getCurrentPlan(userId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/current-plan/${userId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch current plan: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get current plan error:', error);
      throw error;
    }
  }

  async getUsageLimits(userId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/usage-limits/${userId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch usage limits: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get usage limits error:', error);
      throw error;
    }
  }

  async trackUsageEvent(userId: string, eventType: string, metadata?: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/usage-event/${userId}`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({
          event_type: eventType,
          metadata: metadata
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to track usage event: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Track usage event error:', error);
      throw error;
    }
  }

  // Settings API Methods
  async getUserProfile(userId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/profile/${userId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch user profile: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, profileData: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/profile/${userId}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update user profile: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  async getNotificationPreferences(userId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/notifications/${userId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch notification preferences: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get notification preferences error:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(userId: string, notifications: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/notifications/${userId}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(notifications)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update notification preferences: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update notification preferences error:', error);
      throw error;
    }
  }

  async sendTestEmail(email: string, name?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/email/test`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({
          email: email,
          name: name || 'Test User'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send test email: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Send test email error:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(userId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/email/welcome/${userId}`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send welcome email: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Send welcome email error:', error);
      throw error;
    }
  }

  async getEmailServiceStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/email/status`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get email service status: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get email service status error:', error);
      throw error;
    }
  }

  // =====================================
  // EMAIL VERIFICATION METHODS
  // =====================================

  // Send verification code
  async sendVerificationCode(email: string, name?: string): Promise<any> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/verification/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to send verification code: ${response.status} ${JSON.stringify(data)}`);
      }

      return data;
    } catch (error) {
      console.error('Send verification code error:', error);
      throw error;
    }
  }

  // Verify code
  async verifyCode(code: string): Promise<any> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/verification/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to verify code: ${response.status} ${JSON.stringify(data)}`);
      }

      return data;
    } catch (error) {
      console.error('Verify code error:', error);
      throw error;
    }
  }

  // Resend verification code
  async resendVerificationCode(): Promise<any> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/verification/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to resend verification code: ${response.status} ${JSON.stringify(data)}`);
      }

      return data;
    } catch (error) {
      console.error('Resend verification code error:', error);
      throw error;
    }
  }

  // Get verification status
  async getVerificationStatus(): Promise<any> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/verification/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to get verification status: ${response.status} ${JSON.stringify(data)}`);
      }

      return data;
    } catch (error) {
      console.error('Get verification status error:', error);
      throw error;
    }
  }
}

export const podcastApi = new PodcastApiService();
