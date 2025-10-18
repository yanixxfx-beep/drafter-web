'use client';

import { useEffect } from 'react';
import { initializeThumbnailWorker } from '@/utils/thumbnailWorker';
import { requestPersistence, logQuota } from '@/session/usePersistentSession';

export function ClientInitializer() {
  useEffect(() => {
    // Initialize thumbnail worker
    initializeThumbnailWorker();
    
    // Request persistent storage on first user interaction
    const handleFirstInteraction = async () => {
      const persisted = await requestPersistence();
      console.log('Storage persistence requested:', persisted);
      
      // Log storage quota
      await logQuota();
      
      // Remove event listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
    
    // Add event listeners for first user interaction
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  return null; // This component doesn't render anything
}



