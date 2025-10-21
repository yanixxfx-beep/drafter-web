// src/components/SlideEditorCanvas.tsx
import { useRef, useCallback } from "react";
import { useCanvasRender } from "@/hooks/useCanvasRender";

type Props = {
  src?: string;
  bgColor?: string; // default "#000000"
  className?: string; // MUST ensure CSS width/height! e.g. w-[270px] h-[480px]
  cssWidth: number; // Explicit CSS width
  cssHeight: number; // Explicit CSS height
  drawOverlay?: (ctx: CanvasRenderingContext2D, cssW: number, cssH: number) => void;
  dpr?: number; // Device pixel ratio
};

export default function SlideEditorCanvas({ 
  src, 
  bgColor = "#000000", 
  className, 
  cssWidth,
  cssHeight,
  drawOverlay,
  dpr
}: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  
  // Create draw function that handles image loading and overlay
  const draw = useCallback(async (ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number) => {
    // Clear and set background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, w, h)
    
    // Draw image if provided
    if (src) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = src
        })
        
        // Draw image to fill canvas (you can customize this)
        ctx.drawImage(img, 0, 0, w, h)
      } catch (error) {
        console.warn('Failed to load image:', error)
      }
    }
    
    // Draw overlay if provided
    if (drawOverlay) {
      drawOverlay(ctx, w, h)
    }
  }, [src, bgColor, drawOverlay]);
  
  useCanvasRender({
    canvasRef: ref,
    cssWidth,
    cssHeight,
    dpr,
    draw
  });
  
  return <canvas ref={ref} className={className} />;
}
