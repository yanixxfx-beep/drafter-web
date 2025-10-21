// src/hooks/useOnVisible.ts
import { useEffect, useState } from "react";
export function useOnVisible(ref: React.RefObject<HTMLElement>, rootMargin = "200px") {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) setVisible(true);
    }, { root: null, rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return visible;
}



