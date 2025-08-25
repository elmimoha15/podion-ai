/**
 * Upload Storage Utility for Persistent File Upload State
 * Handles localStorage operations for file upload persistence across page refreshes
 */

const UPLOAD_STATE_KEY = 'podion_upload_state';
const MAX_FILE_SIZE_MB = 50; // Don't persist files larger than 50MB

export interface PersistedUploadState {
  uploadMethod: 'file' | 'url';
  selectedWorkspace: string;
  episodeTitle: string;
  episodeDescription: string;
  // File data (only for smaller files)
  fileData?: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
    // Base64 encoded file content (only for small files)
    content?: string;
  };
  // URL data
  urlData?: {
    url: string;
  };
  timestamp: number;
}

/**
 * Store upload state in localStorage
 */
export const storeUploadState = (state: Omit<PersistedUploadState, 'timestamp'>): void => {
  try {
    const stateWithTimestamp: PersistedUploadState = {
      ...state,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(UPLOAD_STATE_KEY, JSON.stringify(stateWithTimestamp));
    console.log('📦 Stored upload state in localStorage');
  } catch (error) {
    console.warn('Failed to store upload state:', error);
  }
};

/**
 * Store file data in localStorage (only for smaller files)
 */
export const storeFileData = async (file: File): Promise<boolean> => {
  try {
    // Don't store large files
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      console.log(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB) - not storing in localStorage`);
      return false;
    }

    // Convert file to base64
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = () => {
        try {
          const base64Content = reader.result as string;
          
          const existingState = getStoredUploadState();
          const updatedState: PersistedUploadState = {
            ...existingState,
            fileData: {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              content: base64Content,
            },
            timestamp: Date.now(),
          };
          
          localStorage.setItem(UPLOAD_STATE_KEY, JSON.stringify(updatedState));
          console.log(`📦 Stored file data for ${file.name} in localStorage`);
          resolve(true);
        } catch (error) {
          console.warn('Failed to store file data:', error);
          resolve(false);
        }
      };
      
      reader.onerror = () => {
        console.warn('Failed to read file for storage');
        resolve(false);
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.warn('Failed to store file data:', error);
    return false;
  }
};

/**
 * Get stored upload state from localStorage
 */
export const getStoredUploadState = (): PersistedUploadState => {
  try {
    const stored = localStorage.getItem(UPLOAD_STATE_KEY);
    if (!stored) {
      return getDefaultUploadState();
    }
    
    const state = JSON.parse(stored) as PersistedUploadState;
    
    // Check if state is too old (older than 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (state.timestamp < oneDayAgo) {
      clearStoredUploadState();
      return getDefaultUploadState();
    }
    
    return state;
  } catch (error) {
    console.warn('Failed to get stored upload state:', error);
    return getDefaultUploadState();
  }
};

/**
 * Convert stored file data back to File object
 */
export const getStoredFile = (): File | null => {
  try {
    const state = getStoredUploadState();
    if (!state.fileData?.content) {
      return null;
    }
    
    // Convert base64 back to File
    const base64Data = state.fileData.content.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: state.fileData.type });
    
    // Create File object with original metadata
    const file = new File([blob], state.fileData.name, {
      type: state.fileData.type,
      lastModified: state.fileData.lastModified,
    });
    
    console.log(`📁 Restored file ${file.name} from localStorage`);
    return file;
  } catch (error) {
    console.warn('Failed to restore file from localStorage:', error);
    return null;
  }
};

/**
 * Clear stored upload state
 */
export const clearStoredUploadState = (): void => {
  try {
    localStorage.removeItem(UPLOAD_STATE_KEY);
    console.log('🧹 Cleared upload state from localStorage');
  } catch (error) {
    console.warn('Failed to clear upload state:', error);
  }
};

/**
 * Check if there's a stored upload state
 */
export const hasStoredUploadState = (): boolean => {
  const state = getStoredUploadState();
  return state.timestamp > 0 && (!!state.fileData || !!state.urlData);
};

/**
 * Get default upload state
 */
const getDefaultUploadState = (): PersistedUploadState => ({
  uploadMethod: 'file',
  selectedWorkspace: '',
  episodeTitle: '',
  episodeDescription: '',
  timestamp: 0,
});

/**
 * Update specific fields in stored upload state
 */
export const updateStoredUploadState = (updates: Partial<Omit<PersistedUploadState, 'timestamp'>>): void => {
  try {
    const existingState = getStoredUploadState();
    const updatedState: PersistedUploadState = {
      ...existingState,
      ...updates,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(UPLOAD_STATE_KEY, JSON.stringify(updatedState));
  } catch (error) {
    console.warn('Failed to update upload state:', error);
  }
};
