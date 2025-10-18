// Global thumbnail worker instance
let thumbnailWorker: Worker | null = null;

// Initialize the worker once
function getThumbnailWorker(): Worker {
  if (!thumbnailWorker) {
    thumbnailWorker = new Worker(new URL('../workers/thumb.worker.ts', import.meta.url), { type: 'module' });
  }
  return thumbnailWorker;
}

// Thumbnail worker initialization and management
export function genThumb(file: File, id: string): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      // Convert File to ArrayBuffer for transfer
      const arrayBuffer = await file.arrayBuffer();
      
      const worker = getThumbnailWorker();
      
      const handleMessage = (e: MessageEvent) => {
        const { id: messageId, thumbBlob, width, height, error } = e.data;
        
        if (messageId === id) {
          worker.removeEventListener('message', handleMessage);
          
          if (error) {
            reject(new Error(error));
          } else {
            resolve({ blob: thumbBlob, width, height });
          }
        }
      };
      
      worker.addEventListener('message', handleMessage);
      
      try {
        worker.postMessage({ 
          id, 
          arrayBuffer, 
          filename: file.name,
          maxSide: 512 
        }, [arrayBuffer]);
      } catch (error) {
        console.error('Failed to post message to worker:', error);
        reject(error);
        return;
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Initialize thumbnail worker on app startup
export function initializeThumbnailWorker() {
  if (typeof window !== 'undefined') {
    (window as any).DRAFTER_THUMBS = genThumb;
  }
}
