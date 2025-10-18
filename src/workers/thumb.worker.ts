// Thumbnail generation worker for smooth UI
// @ts-ignore: web worker
self.onmessage = async (e: MessageEvent) => {
  try {
    const { id, arrayBuffer, maxSide = 512 } = e.data as { id: string; arrayBuffer: ArrayBuffer; maxSide?: number };
    
    if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) {
      throw new Error('Invalid ArrayBuffer received');
    }
    
    // Convert ArrayBuffer back to Blob
    const blob = new Blob([arrayBuffer]);
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));

    const c = new OffscreenCanvas(w, h);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(bmp, 0, 0, w, h);
    const thumbBlob = await c.convertToBlob({ type: "image/webp", quality: 0.85 });

    // Ensure thumbBlob is a proper Blob before transferring
    if (thumbBlob instanceof Blob) {
      (self as any).postMessage({ id, thumbBlob, width: bmp.width, height: bmp.height }, [thumbBlob]);
    } else {
      throw new Error('Failed to create thumbnail blob');
    }
  } catch (error) {
    console.error('Thumbnail worker error:', error);
    (self as any).postMessage({ 
      id: e.data?.id || 'unknown', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};
