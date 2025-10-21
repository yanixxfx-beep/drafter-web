// src/utils/canvas.ts
export function resizeCanvasToCss(canvas: HTMLCanvasElement) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cssW = Math.round(canvas.clientWidth);
  const cssH = Math.round(canvas.clientHeight);

  const width = Math.max(1, cssW * dpr);
  const height = Math.max(1, cssH * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d")!;
  // We will draw in CSS pixel coordinates after setting transform later
  return { ctx, dpr, cssW, cssH };
}

export function resetAndPaintBg(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  bg = "#000000"
) {
  // Reset all state to known baseline
  if ("resetTransform" in ctx) (ctx as any).resetTransform();
  else ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // Clear & paint solid background (avoid transparency showing parent CSS)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawContain(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  targetCssW: number,
  targetCssH: number
) {
  const iw = (img as any).naturalWidth ?? (img as any).width;
  const ih = (img as any).naturalHeight ?? (img as any).height;
  if (!iw || !ih) return;

  const scale = Math.min(targetCssW / iw, targetCssH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (targetCssW - dw) / 2;
  const dy = (targetCssH - dh) / 2;

  // draw in CSS pixel space (transform will be set to dpr below)
  ctx.drawImage(img as any, dx, dy, dw, dh);
}

export async function loadBitmapFromUrl(url: string): Promise<ImageBitmap> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await createImageBitmap(blob);
}

export async function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  img.crossOrigin = "anonymous"; // fine for blob: URLs; harmless otherwise
  img.src = url;
  if (img.decode) {
    await img.decode().catch(() => {});
  } else {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load failed"));
    });
  }
  return img;
}



