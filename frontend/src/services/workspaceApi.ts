import { auth } from '../lib/firebase';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata: {
    version: string;
    podcast_count: number;
  };
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
}

export interface WorkspaceResponse {
  success: boolean;
  workspace_id?: string;
  workspace_data?: Workspace;
  error?: string;
}

export interface WorkspaceListResponse {
  success: boolean;
  workspaces?: Workspace[];
  count?: number;
  user_id?: string;
  error?: string;
}

class WorkspaceApiService {
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

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to perform this action.');
      }
      if (response.status === 404) {
        throw new Error('Workspace not found.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async createWorkspace(data: CreateWorkspaceRequest): Promise<Workspace> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/workspaces`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const result: WorkspaceResponse = await this.handleResponse(response);
      
      if (!result.success || !result.workspace_data) {
        throw new Error(result.error || 'Failed to create workspace');
      }

      return result.workspace_data;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }

  async getWorkspaces(): Promise<Workspace[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/workspaces`, {
        method: 'GET',
        headers,
      });

      const result: WorkspaceListResponse = await this.handleResponse(response);
      
      if (!result.success || !result.workspaces) {
        throw new Error(result.error || 'Failed to fetch workspaces');
      }

      return result.workspaces;
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw error;
    }
  }

  async getWorkspace(workspaceId: string): Promise<Workspace> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
        method: 'GET',
        headers,
      });

      const result: WorkspaceResponse = await this.handleResponse(response);
      
      if (!result.success || !result.workspace_data) {
        throw new Error(result.error || 'Failed to fetch workspace');
      }

      return result.workspace_data;
    } catch (error) {
      console.error('Error fetching workspace:', error);
      throw error;
    }
  }

  async updateWorkspace(workspaceId: string, data: UpdateWorkspaceRequest): Promise<Workspace> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      const result: WorkspaceResponse = await this.handleResponse(response);
      
      if (!result.success || !result.workspace_data) {
        throw new Error(result.error || 'Failed to update workspace');
      }

      return result.workspace_data;
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw error;
    }
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers,
      });

      const result = await this.handleResponse<{success: boolean; error?: string}>(response);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete workspace');
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw error;
    }
  }

  async getWorkspaceStats(workspaceId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/stats`, {
        method: 'GET',
        headers,
      });

      const result = await this.handleResponse<{success: boolean; stats?: any; error?: string}>(response);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch workspace stats');
      }

      return result.stats;
    } catch (error) {
      console.error('Error fetching workspace stats:', error);
      throw error;
    }
  }
}

export const workspaceApi = new WorkspaceApiService();
