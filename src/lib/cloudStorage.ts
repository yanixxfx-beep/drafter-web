// Google Cloud Storage integration for Drafter
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Path to service account key file
});

// Bucket name - you'll need to create this in Google Cloud Console
const BUCKET_NAME = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'drafter-files';

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

export interface UploadResult {
  success: boolean;
  file?: CloudFile;
  error?: string;
}

// Generate a unique file path for organization
function generateFilePath(category: string, format: string, fileName: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const fileExtension = fileName.split('.').pop();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `users/default/${category}/${format}/${timestamp}_${randomId}_${cleanFileName}`;
}

// Upload file to Google Cloud Storage
export async function uploadFile(
  file: Express.Multer.File,
  category: string,
  format: string
): Promise<UploadResult> {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const filePath = generateFilePath(category, format, file.originalname);
    const fileUpload = bucket.file(filePath);

    // Upload file to Google Cloud Storage
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          category,
          format,
          uploadedAt: Date.now().toString(),
        },
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Upload error:', error);
        resolve({
          success: false,
          error: error.message,
        });
      });

      stream.on('finish', async () => {
        try {
          // Make the file publicly accessible
          await fileUpload.makePublic();
          
          // Get the public URL
          const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`;
          
          const cloudFile: CloudFile = {
            id: `${category}-${format}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
            name: file.originalname,
            category,
            format,
            type: file.mimetype,
            size: file.size,
            uploadedAt: Date.now(),
            url: publicUrl,
          };

          resolve({
            success: true,
            file: cloudFile,
          });
        } catch (error) {
          console.error('Error making file public:', error);
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Delete file from Google Cloud Storage
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(filePath);
    
    await file.delete();
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

// List files in a specific category/format
export async function listFiles(category: string, format: string): Promise<CloudFile[]> {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const prefix = `users/default/${category}/${format}/`;
    
    const [files] = await bucket.getFiles({ prefix });
    
    const cloudFiles: CloudFile[] = [];
    
    for (const file of files) {
      try {
        const [metadata] = await file.getMetadata();
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${file.name}`;
        
        cloudFiles.push({
          id: `${category}-${format}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          name: metadata.metadata?.originalName || file.name.split('/').pop() || 'unknown',
          category,
          format,
          type: metadata.contentType || 'application/octet-stream',
          size: parseInt(metadata.size || '0'),
          uploadedAt: parseInt(metadata.metadata?.uploadedAt || Date.now().toString()),
          url: publicUrl,
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    return cloudFiles.sort((a, b) => b.uploadedAt - a.uploadedAt);
  } catch (error) {
    console.error('List files error:', error);
    return [];
  }
}

// Get storage statistics
export async function getStorageStats(): Promise<{ totalFiles: number; totalSize: number }> {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const [files] = await bucket.getFiles();
    
    let totalSize = 0;
    let totalFiles = 0;
    
    for (const file of files) {
      try {
        const [metadata] = await file.getMetadata();
        totalSize += parseInt(metadata.size || '0');
        totalFiles++;
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    return { totalFiles, totalSize };
  } catch (error) {
    console.error('Storage stats error:', error);
    return { totalFiles: 0, totalSize: 0 };
  }
}



