// Cloud storage client for frontend - replaces IndexedDB
export interface CloudFile {
  id: string;
  name: string;
  category: string;
  format: string;
  type: string;
  size: number;
  uploadedAt: number;
  url: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  file?: CloudFile;
  error?: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
}

// Upload file to cloud storage with progress tracking
export async function uploadFileToCloud(
  file: File,
  category: string,
  format: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('format', format);

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          };
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            resolve({
              success: false,
              error: 'Invalid response format',
            });
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            resolve({
              success: false,
              error: errorResponse.error || 'Upload failed',
            });
          } catch (error) {
            resolve({
              success: false,
              error: `Upload failed with status ${xhr.status}`,
            });
          }
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload',
        });
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// List files from cloud storage
export async function listFilesFromCloud(category: string, format: string): Promise<CloudFile[]> {
  try {
    const response = await fetch(`/api/files/list?category=${encodeURIComponent(category)}&format=${encodeURIComponent(format)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.files;
    } else {
      throw new Error(data.error || 'Failed to list files');
    }
  } catch (error) {
    console.error('List files error:', error);
    return [];
  }
}

// Delete file from cloud storage
export async function deleteFileFromCloud(filePath: string): Promise<boolean> {
  try {
    const response = await fetch('/api/files/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Delete file error:', error);
    return false;
  }
}

// Get storage statistics
export async function getCloudStorageStats(): Promise<StorageStats> {
  try {
    const response = await fetch('/api/files/stats');
    
    if (!response.ok) {
      throw new Error(`Failed to get storage stats: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.stats;
    } else {
      throw new Error(data.error || 'Failed to get storage stats');
    }
  } catch (error) {
    console.error('Storage stats error:', error);
    return { totalFiles: 0, totalSize: 0 };
  }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date for display
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}



