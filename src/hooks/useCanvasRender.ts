// src/hooks/useCanvasRender.ts
import { useEffect } from "react";
import { drawContain, loadBitmapFromUrl, loadHtmlImage, resetAndPaintBg, resizeCanvasToCss } from "@/utils/canvas";
import { getOrCreateBitmap } from "@/utils/bitmapCache";
import { getBlobForUrl } from "@/utils/blobCache";
import { decodeBitmapAtSizeFromFile } from "@/utils/decode";
import { TaskQueue } from "@/utils/taskQueue";

type RenderOpts = {
  src?: string;          // blob/object URL
  bgColor?: string;      // default "#000000"
  drawOverlay?: (ctx: CanvasRenderingContext2D, cssW: number, cssH: number) => void; // text, guides
  preferBitmap?: boolean; // default true
  priority?: 'high' | 'low'; // default 'low'
};

// Create separate queues for different priorities
const highPriorityQueue = new TaskQueue(1); // Editor gets priority
const lowPriorityQueue = new TaskQueue(3);  // Thumbnails get lower priority

export function useCanvasRender(canvas: HTMLCanvasElement | null, opts: RenderOpts) {
  useEffect(() => {
    if (!canvas) return;
    const { src, bgColor = "#000000", drawOverlay, preferBitmap = true, priority = 'low' } = opts;
    let cancelled = false;


    // Ensure backing store matches CSS size
    const { ctx, dpr, cssW, cssH } = resizeCanvasToCss(canvas);
    resetAndPaintBg(ctx, canvas, bgColor);

    // Calculate target size for decoding (2x for HiDPI)
    const targetW = cssW * dpr;
    const targetH = cssH * dpr;

    async function draw() {
      if (!src) {
        if (drawOverlay && !cancelled) drawOverlay(ctx, cssW, cssH);
        return;
      }

      // Create cache key for this image and size
      const cacheKey = `${src}@${targetW}x${targetH}`;
      const queue = priority === 'high' ? highPriorityQueue : lowPriorityQueue;

      try {
        
        // Use cached bitmap or create new one
        const bmp = await getOrCreateBitmap(
          cacheKey,
          () => queue.add(async () => {
            const t0 = performance.now();
            const blob = await getBlobForUrl(src);
            const t1 = performance.now();
            const bitmap = await decodeBitmapAtSizeFromFile(blob, targetW, targetH);
            const t2 = performance.now();
            return bitmap;
          }),
          targetW,
          targetH
        );

        if (cancelled) { 
          try { (bmp as any).close?.(); } catch {} 
          return; 
        }

        // Draw in CSS pixel coordinates
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawContain(ctx, bmp, cssW, cssH);
        // Don't close the bitmap here - it's cached and might be reused

      } catch (error) {
        console.error('❌ useCanvasRender: Fast path failed, trying fallback:', error);
        if (cancelled) return;
        
        // Fallback to old method
        try {
          if (preferBitmap && "createImageBitmap" in window) {
            const bmp = await loadBitmapFromUrl(src);
            if (cancelled) { try { (bmp as any).close?.(); } catch {} return; }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            drawContain(ctx, bmp, cssW, cssH);
            try { (bmp as any).close?.(); } catch {}
          } else {
            const img = await loadHtmlImage(src);
            if (cancelled) return;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            drawContain(ctx, img, cssW, cssH);
          }
        } catch (fallbackError) {
          console.error('❌ useCanvasRender: All methods failed:', fallbackError);
          // Paint distinct fallback so failures are obvious
          resetAndPaintBg(ctx, canvas, "#404040");
        }
      }

      if (cancelled) return;
      if (drawOverlay) {
        drawOverlay(ctx, cssW, cssH);
      }
    }

    draw();

    const ro = new ResizeObserver(() => {
      const { ctx } = resizeCanvasToCss(canvas);
      resetAndPaintBg(ctx, canvas, bgColor);
      // Re-render current frame on resize
      draw();
    });
    ro.observe(canvas);

    return () => { cancelled = true; ro.disconnect(); };
  }, [canvas, opts.src, opts.bgColor, opts.drawOverlay, opts.preferBitmap, opts.priority]);
}
