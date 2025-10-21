// src/utils/blobCache.ts
const blobCache = new Map<string, Promise<Blob>>();

export function getBlobForUrl(url: string) {
  let p = blobCache.get(url);
  if (!p) {
    p = fetch(url).then(r => r.blob());
    blobCache.set(url, p);
  }
  return p;
}



