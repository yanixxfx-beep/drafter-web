// src/components/SlideEditorCanvas.tsx
import { useRef, useMemo } from "react";
import { useCanvasRender } from "@/hooks/useCanvasRender";

type Props = {
  src?: string;
  bgColor?: string; // default "#000000"
  className?: string; // MUST ensure CSS width/height! e.g. w-[270px] h-[480px]
  drawOverlay?: (ctx: CanvasRenderingContext2D, cssW: number, cssH: number) => void;
  priority?: 'high' | 'low'; // default 'low'
};

export default function SlideEditorCanvas({ src, bgColor = "#000000", className, drawOverlay, priority = 'low' }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  
  // Memoize render options for better performance
  const renderOptions = useMemo(() => ({
    src,
    bgColor,
    drawOverlay,
    preferBitmap: true,
    priority
  }), [src, bgColor, drawOverlay, priority]);
  
  useCanvasRender(ref.current, renderOptions);
  return <canvas ref={ref} className={className} />;
}
