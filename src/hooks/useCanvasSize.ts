import { useEffect, useState } from "react";

export function useCanvasSize(ref: React.RefObject<HTMLCanvasElement>, fallback = { w: 270, h: 480 }) {
  const [size, setSize] = useState({ w: fallback.w, h: fallback.h });
  
  useEffect(() => {
    if (!ref.current) return;
    
    const el = ref.current;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    });
    
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  
  return size;
}


