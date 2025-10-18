// React hook for persistent session management with OPFS
import { useEffect, useState } from "react";
import { SessionStore } from "./sessionStore";
import { OPFSStorage } from "../storage/opfs";

export function usePersistentSession() {
  const [store, setStore] = useState<SessionStore | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const last = localStorage.getItem("drafter:lastSession");
        const s = new SessionStore(last ?? undefined, new OPFSStorage());
        await s.init();
        setStore(s);
        setReady(true);
      } catch (error) {
        console.error('Failed to initialize persistent session:', error);
        // Try to create a new session if the old one is corrupted
        try {
          console.log('Creating new session due to corruption...');
          localStorage.removeItem("drafter:lastSession");
          const s = new SessionStore(undefined, new OPFSStorage());
          await s.init();
          setStore(s);
          setReady(true);
        } catch (newError) {
          console.error('Failed to create new session:', newError);
          setReady(true); // Still set ready to show error state
        }
      }
    })();
  }, []);

  return { store, ready };
}

// Utility functions for storage persistence
export async function requestPersistence(): Promise<boolean> {
  if (navigator.storage && "persisted" in navigator.storage) {
    const persisted = await navigator.storage.persisted();
    if (persisted) return true;
  }
  if (navigator.storage && "persist" in navigator.storage) {
    return await navigator.storage.persist();
  }
  return false;
}

export async function logQuota() {
  const est = await navigator.storage.estimate();
  console.log("Storage usage:", est.usage, "quota:", est.quota);
}



