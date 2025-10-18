/** Minimal header sniffing to identify formats early */
async function readHeader(blob: Blob, len = 32): Promise<Uint8Array> {
  const slice = blob.slice(0, len);
  const buf = await slice.arrayBuffer();
  return new Uint8Array(buf);
}

function toHex(u8: Uint8Array) {
  return Array.from(u8).map(b => b.toString(16).padStart(2, '0')).join(' ');
}

function sniffType(u8: Uint8Array): string | null {
  const str4 = String.fromCharCode(...u8.slice(0,4));
  // PNG
  if (u8.length >= 8 && u8[0]===0x89 && u8[1]===0x50 && u8[2]===0x4E && u8[3]===0x47) return 'image/png';
  // JPEG
  if (u8.length >= 3 && u8[0]===0xFF && u8[1]===0xD8 && u8[2]===0xFF) return 'image/jpeg';
  // GIF
  if (str4 === 'GIF8') return 'image/gif';
  // WEBP (RIFF....WEBP)
  if (str4 === 'RIFF' && String.fromCharCode(...u8.slice(8,12)) === 'WEBP') return 'image/webp';
  // ISO-BMFF (AVIF/HEIC/HEIF) — look for 'ftyp'
  if (String.fromCharCode(...u8.slice(4,8)) === 'ftyp') {
    const brand = String.fromCharCode(...u8.slice(8,12));
    if (brand.startsWith('avif')) return 'image/avif';
    if (brand.startsWith('heic') || brand.startsWith('heix') || brand.startsWith('heif') ||
        brand.startsWith('hevc') || brand.startsWith('hevx') || brand.startsWith('mif1')) {
      return 'image/heic'; // treat generically as HEIC/HEIF
    }
  }
  return null;
}

function looksLikeHeic(ext: string | undefined, sniff: string | null): boolean {
  if (sniff === 'image/heic') return true;
  if (!ext) return false;
  const e = ext.toLowerCase();
  return e.endsWith('.heic') || e.endsWith('.heif');
}

/** Main loader for OPFS file handles */
export type LoadResult = {
  ok: boolean;
  source: 'bitmap' | 'webcodecs' | 'htmlimg' | 'heic-converted';
  element?: ImageBitmap | HTMLImageElement;
  blob?: Blob;
  objectUrl?: string;
  width?: number;
  height?: number;
  type?: string;
  reason?: string;
  error?: any;
  headerHex?: string;
};

export async function loadFromOPFS(
  handle: FileSystemFileHandle,
  opts?: { preferBitmap?: boolean; allowWebCodecs?: boolean }
): Promise<LoadResult> {
  const preferBitmap = opts?.preferBitmap ?? true;
  const allowWebCodecs = opts?.allowWebCodecs ?? true;
  let file: File, blob: Blob, url: string | undefined;
  
  try {
    file = await handle.getFile();
    blob = file;
  } catch (e) {
    return { ok: false, source: 'bitmap', reason: 'getFile-failed', error: e };
  }
  
  if (!blob || blob.size === 0) {
    return { ok: false, source: 'bitmap', reason: 'empty-blob' };
  }
  
  const header = await readHeader(blob);
  const headerHex = toHex(header);
  const sniff = sniffType(header);
  const ext = handle.name; // may include extension
  const mime = blob.type || sniff || undefined;

  // HEIC handling (Chrome/Edge don't decode HEIC)
  const isHeic = looksLikeHeic(ext, sniff) || (mime === 'image/heic');
  if (isHeic) {
    try {
      // Dynamic import for heic2any to avoid bundle bloat
      const heic2any = (await import(/* webpackChunkName: "heic2any" */ 'heic2any')).default as any;
      const converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.92 });
      // Ensure Blob type is set
      const convBlob = converted instanceof Blob ? converted : new Blob([converted], { type: 'image/jpeg' });
      const ib = await createImageBitmap(convBlob, { imageOrientation: 'from-image' as any });
      return { ok: true, source: 'heic-converted', element: ib, blob: convBlob, width: ib.width, height: ib.height, type: 'image/jpeg', headerHex };
    } catch (e) {
      return { ok: false, source: 'heic-converted', reason: 'heic-convert-failed', error: e, headerHex };
    }
  }

  // Try createImageBitmap first (fast path)
  if (preferBitmap && 'createImageBitmap' in window) {
    try {
      const ib = await createImageBitmap(blob, { imageOrientation: 'from-image' as any });
      return { ok: true, source: 'bitmap', element: ib, blob, width: ib.width, height: ib.height, type: mime, headerHex };
    } catch (e) {
      // continue to fallbacks
    }
  }

  // Try WebCodecs ImageDecoder if supported for the MIME
  if (allowWebCodecs && 'ImageDecoder' in window && (window as any).ImageDecoder.isTypeSupported?.(mime || '')) {
    try {
      // @ts-ignore
      const dec = new (window as any).ImageDecoder({ data: blob, type: mime });
      const { image } = await dec.decode();
      const ib = await createImageBitmap(image);
      return { ok: true, source: 'webcodecs', element: ib, blob, width: ib.displayWidth, height: ib.displayHeight, type: mime, headerHex };
    } catch (e) {
      // continue to HTMLImage fallback
    }
  }

  // HTMLImageElement fallback
  try {
    url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    // crossOrigin is not needed for blob: URLs; omitting prevents taint confusion
    img.src = url;
    await img.decode();
    return { ok: true, source: 'htmlimg', element: img, blob, objectUrl: url, width: img.naturalWidth, height: img.naturalHeight, type: mime, headerHex };
  } catch (e) {
    return { ok: false, source: 'htmlimg', reason: 'htmlimg-decode-failed', error: e, headerHex, type: mime };
  } finally {
    // If you don't need to keep the image around, revoke later (after drawing).
    // URL.revokeObjectURL(url!);
  }
}

/** Helper to log failures with context */
export function logLoadResult(name: string, res: LoadResult) {
  const status = res.ok ? 'OK' : 'FAIL';
  console.groupCollapsed(`[${status}] ${name}`);
  console.log({ source: res.source, type: res.type, width: res.width, height: res.height, reason: res.reason, headerHex: res.headerHex, error: res.error });
  if (res.error) console.error(res.error);
  console.groupEnd();
}

/** Enhanced loadWithOrientation that works with both OPFS handles and URLs */
export async function loadWithOrientationEnhanced(src: string | FileSystemFileHandle): Promise<ImageBitmap | HTMLImageElement> {
  // If it's a FileSystemFileHandle, use the OPFS loader
  if (src && typeof src === 'object' && 'getFile' in src) {
    const result = await loadFromOPFS(src as FileSystemFileHandle);
    logLoadResult((src as FileSystemFileHandle).name, result);
    
    if (!result.ok) {
      throw new Error(`Failed to load image: ${result.reason} - ${result.error?.message || 'Unknown error'}`);
    }
    
    return result.element!;
  }
  
  // Fallback to original loadWithOrientation for string URLs
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.src = src as string;
  await img.decode();
  if ("createImageBitmap" in window) {
    try { 
      return await createImageBitmap(img, { imageOrientation: "from-image" as any }); 
    } catch {} 
  }
  return img;
}


