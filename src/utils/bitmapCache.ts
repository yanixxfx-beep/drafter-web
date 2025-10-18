// src/utils/bitmapCache.ts
type Key = string; // e.g., `${fileId}@${w}x${h}`

const inflight = new Map<Key, Promise<ImageBitmap>>();
const cache = new Map<Key, { bmp: ImageBitmap, bytes: number, last: number }>();
const MAX_BYTES = 300 * 1024 * 1024; // ~300MB cap (tune)

function estimateBytes(w: number, h: number) { return w * h * 4; }

export function getOrCreateBitmap(
  key: Key,
  loader: () => Promise<ImageBitmap>,
  approxW: number, approxH: number
): Promise<ImageBitmap> {
  const hit = cache.get(key);
  if (hit) { hit.last = performance.now(); return Promise.resolve(hit.bmp); }
  const pending = inflight.get(key);
  if (pending) return pending;

  const p = loader().then(bmp => {
    inflight.delete(key);
    // Insert with LRU eviction:
    const bytes = estimateBytes(approxW, approxH);
    cache.set(key, { bmp, bytes, last: performance.now() });
    let total = 0;
    for (const v of cache.values()) total += v.bytes;
    if (total > MAX_BYTES) {
      // Evict least-recently-used until within budget
      const arr = [...cache.entries()].sort((a,b) => a[1].last - b[1].last);
      for (const [k, v] of arr) {
        if (total <= MAX_BYTES) break;
        try { (v.bmp as any).close?.(); } catch {}
        cache.delete(k);
        total -= v.bytes;
      }
    }
    return bmp;
  }, err => { inflight.delete(key); throw err; });

  inflight.set(key, p);
  return p;
}

