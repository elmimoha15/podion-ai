import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { workspaceApi, type Workspace } from '@/services/workspaceApi';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  error: string | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (data: { name: string; description?: string }) => Promise<Workspace>;
  updateWorkspace: (id: string, data: { name?: string; description?: string }) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Load workspaces when user is authenticated
  useEffect(() => {
    if (currentUser) {
      refreshWorkspaces();
    } else {
      // Clear workspaces when user logs out
      setWorkspaces([]);
      setCurrentWorkspace(null);
    }
  }, [currentUser]);

  // Set first workspace as current if none selected
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      setCurrentWorkspace(workspaces[0]);
    }
  }, [workspaces, currentWorkspace]);

  const refreshWorkspaces = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const data = await workspaceApi.getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (data: { name: string; description?: string }): Promise<Workspace> => {
    try {
      const workspace = await workspaceApi.createWorkspace(data);
      setWorkspaces(prev => [workspace, ...prev]);
      
      // Set as current workspace if it's the first one
      if (workspaces.length === 0) {
        setCurrentWorkspace(workspace);
      }
      
      toast.success(`Workspace "${workspace.name}" created successfully!`);
      return workspace;
    } catch (error) {
      console.error('Failed to create workspace:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create workspace');
      throw error;
    }
  };

  const updateWorkspace = async (id: string, data: { name?: string; description?: string }): Promise<Workspace> => {
    try {
      const updatedWorkspace = await workspaceApi.updateWorkspace(id, data);
      
      setWorkspaces(prev => 
        prev.map(w => w.id === id ? updatedWorkspace : w)
      );
      
      // Update current workspace if it's the one being updated
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(updatedWorkspace);
      }
      
      toast.success(`Workspace "${updatedWorkspace.name}" updated successfully!`);
      return updatedWorkspace;
    } catch (error) {
      console.error('Failed to update workspace:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update workspace');
      throw error;
    }
  };

  const deleteWorkspace = async (id: string): Promise<void> => {
    try {
      await workspaceApi.deleteWorkspace(id);
      
      setWorkspaces(prev => prev.filter(w => w.id !== id));
      
      // Clear current workspace if it's the one being deleted
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(workspaces.length > 1 ? workspaces.find(w => w.id !== id) || null : null);
      }
      
      toast.success('Workspace deleted successfully');
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete workspace');
      throw error;
    }
  };

  const value: WorkspaceContextType = {
    workspaces,
    currentWorkspace,
    loading,
    error,
    setCurrentWorkspace,
    refreshWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
