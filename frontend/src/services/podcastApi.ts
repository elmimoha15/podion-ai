import { auth } from '../lib/firebase';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface PodcastUploadResponse {
  success: boolean;
  upload_id?: string;
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

      const response = await fetch(`${API_BASE_URL}/quick-upload`, {
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
}

export const podcastApi = new PodcastApiService();
