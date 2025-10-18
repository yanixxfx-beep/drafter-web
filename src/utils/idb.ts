// IndexedDB helper for storing tiny metadata and pointers only (no blobs)
export const idb = {
  get<T = any>(key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("drafterMeta", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("kv");
      req.onsuccess = () => {
        const tx = req.result.transaction("kv", "readonly");
        const get = tx.objectStore("kv").get(key);
        get.onsuccess = () => resolve(get.result as T | undefined);
        get.onerror = reject;
      };
      req.onerror = reject;
    });
  },
  set<T = any>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("drafterMeta", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("kv");
      req.onsuccess = () => {
        const tx = req.result.transaction("kv", "readwrite");
        tx.objectStore("kv").put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = reject;
      };
      req.onerror = reject;
    });
  },
};



