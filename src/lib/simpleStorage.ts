// Persistent storage with IndexedDB for file data and localStorage for metadata
// Files are stored as Blobs in IndexedDB with metadata in localStorage

export interface StoredFile {
  id: string;
  category: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: number;
}

// Cache for object URLs (recreated from IndexedDB blobs)
const fileObjectURLs = new Map<string, string>();

const STORAGE_KEY = 'drafter_file_metadata';
const DB_NAME = 'DrafterFiles';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// Get metadata from localStorage
export function getMetadata(): StoredFile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load metadata:', error);
    return [];
  }
}

// Save metadata to localStorage
function saveMetadata(files: StoredFile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch (error) {
    console.error('Failed to save metadata:', error);
  }
}

// IndexedDB operations
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function saveFileToIndexedDB(id: string, file: File): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.put({ id, blob: file });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getFileFromIndexedDB(id: string): Promise<File | null> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.blob : null);
    };
    request.onerror = () => reject(request.error);
  });
}

async function deleteFileFromIndexedDB(id: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveFiles(files: File[], category: string): Promise<StoredFile[]> {
  const metadata = getMetadata();
  const newFiles: StoredFile[] = [];

  for (const file of files) {
    const id = `${category}-${file.name}-${Date.now()}-${Math.random()}`;
    
    try {
      // Save file to IndexedDB
      await saveFileToIndexedDB(id, file);
      
      // Create object URL for immediate use
      const objectUrl = URL.createObjectURL(file);
      fileObjectURLs.set(id, objectUrl);
      
      // Create metadata
      const storedFile: StoredFile = {
        id,
        category,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: Date.now(),
      };
      
      metadata.push(storedFile);
      newFiles.push(storedFile);
      
      console.log(`Saved file ${file.name} (${file.size} bytes) to ${category} category`);
    } catch (error) {
      console.error(`Failed to save file ${file.name}:`, error);
    }
  }

  saveMetadata(metadata);
  return newFiles;
}

export async function getFilesByCategory(category: string): Promise<Array<StoredFile & { url: string }>> {
  const metadata = getMetadata();
  const results: Array<StoredFile & { url: string }> = [];
  
  for (const f of metadata.filter(f => f.category === category)) {
    try {
      // Try to get cached object URL first
      let url = fileObjectURLs.get(f.id);
      
      // If not cached, load from IndexedDB
      if (!url) {
        const file = await getFileFromIndexedDB(f.id);
        if (file) {
          url = URL.createObjectURL(file);
          fileObjectURLs.set(f.id, url);
        }
      }
      
      if (url) {
        results.push({
          ...f,
          url,
        });
      }
    } catch (error) {
      console.error(`Failed to load file ${f.id}:`, error);
    }
  }
  
  return results;
}

export async function getAllFiles(): Promise<Array<StoredFile & { url: string }>> {
  const metadata = getMetadata();
  const results: Array<StoredFile & { url: string }> = [];
  
  for (const f of metadata) {
    try {
      // Try to get cached object URL first
      let url = fileObjectURLs.get(f.id);
      
      // If not cached, load from IndexedDB
      if (!url) {
        const file = await getFileFromIndexedDB(f.id);
        if (file) {
          url = URL.createObjectURL(file);
          fileObjectURLs.set(f.id, url);
        }
      }
      
      if (url) {
        results.push({
          ...f,
          url,
        });
      }
    } catch (error) {
      console.error(`Failed to load file ${f.id}:`, error);
    }
  }
  
  return results;
}

export async function deleteFile(id: string): Promise<void> {
  // Revoke object URL to free memory
  const url = fileObjectURLs.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    fileObjectURLs.delete(id);
  }

  // Delete file data from IndexedDB
  try {
    await deleteFileFromIndexedDB(id);
  } catch (error) {
    console.error(`Failed to delete file ${id} from IndexedDB:`, error);
  }

  // Remove from metadata
  const metadata = getMetadata();
  const filtered = metadata.filter(f => f.id !== id);
  saveMetadata(filtered);
}

export async function deleteFilesByCategory(category: string): Promise<void> {
  const metadata = getMetadata();
  const toDelete = metadata.filter(f => f.category === category);
  
  // Revoke all object URLs and delete file data
  for (const file of toDelete) {
    const url = fileObjectURLs.get(file.id);
    if (url) {
      URL.revokeObjectURL(url);
      fileObjectURLs.delete(file.id);
    }
    try {
      await deleteFileFromIndexedDB(file.id);
    } catch (error) {
      console.error(`Failed to delete file ${file.id} from IndexedDB:`, error);
    }
  }

  // Remove from metadata
  const filtered = metadata.filter(f => f.category !== category);
  saveMetadata(filtered);
}

export async function clearAllFiles(): Promise<void> {
  // Revoke all object URLs
  for (const url of fileObjectURLs.values()) {
    URL.revokeObjectURL(url);
  }
  fileObjectURLs.clear();

  // Clear all file data from IndexedDB
  const metadata = getMetadata();
  for (const file of metadata) {
    try {
      await deleteFileFromIndexedDB(file.id);
    } catch (error) {
      console.error(`Failed to delete file ${file.id} from IndexedDB:`, error);
    }
  }

  // Clear metadata
  localStorage.removeItem(STORAGE_KEY);
}

export function getStorageStats() {
  const metadata = getMetadata();
  const total = metadata.reduce((sum, f) => sum + f.size, 0);
  return {
    fileCount: metadata.length,
    totalSize: total,
    categories: {
      affiliate: metadata.filter(f => f.category === 'affiliate').length,
      'ai-method': metadata.filter(f => f.category === 'ai-method').length,
    }
  };
}


