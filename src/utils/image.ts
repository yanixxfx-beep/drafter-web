export function drawCover(ctx: CanvasRenderingContext2D, img: ImageBitmap | HTMLImageElement, W: number, H: number) {
  const iw = (img as any).width, ih = (img as any).height;
  const s = Math.max(W/iw, H/ih);
  const dw = iw*s, dh = ih*s;
  ctx.drawImage(img as any, (W-dw)/2, (H-dh)/2, dw, dh);
}

export function drawContain(ctx: CanvasRenderingContext2D, img: ImageBitmap | HTMLImageElement, W: number, H: number) {
  const iw = (img as any).width, ih = (img as any).height;
  const s = Math.min(W/iw, H/ih);
  const dw = iw*s, dh = ih*s;
  ctx.drawImage(img as any, (W-dw)/2, (H-dh)/2, dw, dh);
}

export async function loadWithOrientation(src: string): Promise<ImageBitmap | HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.src = src;
  await img.decode();
  if ("createImageBitmap" in window) {
    try { 
      return await createImageBitmap(img, { imageOrientation: "from-image" as any }); 
    } catch {} 
  }
  return img;
}


