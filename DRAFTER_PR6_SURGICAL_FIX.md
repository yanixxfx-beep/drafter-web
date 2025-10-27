
# Drafter PR #6 — Surgical Fix Plan (drop‑in for Codex/Cursor)

**Goal:** Unblock PR #6 by restoring build/runtime without altering the existing UI. Keep the current layout, classNames, and styles **exactly** the same. This is a **surgical** wiring + type-safety pass to resolve undefined references and centralize canvas rendering.

---

## ✅ Scope & Guardrails (do this, not that)

- **Do not** redesign or restyle any component. No visual diffs.
- **Do not** move files unless specified below.
- **Do** make the app compile and run by:
  - Reintroducing *local wrappers* in `GeneratePage.tsx` for missing calls (`startGeneration`, `handleRandomCaption`, `handleRandomImage`) and delegating to new modules.
  - Removing a **duplicate** `useMemo` in `SlideEditor.tsx`.
  - Centralizing drawing logic into a single hook `useCanvasRender` used by a small orchestrator `SlideRenderer`.
  - Adding a tiny `thumbnail` helper.
- **Imports:** Prefer your `@/` alias if configured; otherwise use relative paths (as shown).

---

## 🧭 High‑Level Plan

1) **Re‑stitch GeneratePage**
   - Add a local `startGeneration()` wrapper that calls `generateSlides(...)` from `src/lib/render/SlideRenderer.ts`.
   - Provide thin wrappers for `handleRandomCaption` and `handleRandomImage` (call existing randomizers if they exist; otherwise no‑ops).
   - Keep existing handlers/JSX intact.

2) **Single source of truth for canvas rendering**
   - Implement `src/hooks/useCanvasRender.ts` to expose `renderSlideToCanvas` and `renderSlideToBlob`.
   - Use it everywhere that draws to canvas/produces blobs.

3) **Generation orchestrator**
   - Implement `src/lib/render/SlideRenderer.ts` that takes an array of slide inputs and runs a tiny worker pool to produce blobs and progress.

4) **Thumbnails**
   - Implement `src/lib/images/thumbnail.ts` to build small previews via the same rendering path.

5) **SlideEditor duplication fix**
   - Remove the **duplicate** `useMemo` for `imageTransform`; keep only one instance with the correct deps.

6) **Type safety + non‑null ctx**
   - Guard `canvas.getContext('2d')` calls and ensure width/height set **before** drawing.

---

## 📁 Files to add/update

> Adjust import paths to match your project (`@/` vs relative). If `@` alias exists, replace `../../` etc. with `@/` equivalents.

### A) `src/components/pages/GeneratePage.tsx` — *wrap the missing calls*

```tsx
// Add near existing imports:
import { generateSlides, type GenerateSlidesOptions } from '../../lib/render/SlideRenderer';

// ... inside the component ...
const startGeneration = useCallback(async () => {
  const opts: GenerateSlidesOptions = {
    slides: slidesRef.current ?? [],
    concurrency: 2,
    onProgress: (p) => setGenerationProgress(p),
    signal: cancelControllerRef.current?.signal,
  };
  await generateSlides(opts);
}, [setGenerationProgress]);

const handleRandomCaption = useCallback(() => {
  if (typeof randomizeCaption === 'function') randomizeCaption();
}, []);

const handleRandomImage = useCallback(() => {
  if (typeof randomizeImage === 'function') randomizeImage();
}, []);

const generateAllDrafts = useCallback(async () => {
  await startGeneration();
}, [startGeneration]);
```

> **Notes**  
> - Keep all existing UI and handlers unchanged. Replace any stray `startGeneration()` references with the wrapper above (if needed).  
> - Wire the `slidesRef` / `setGenerationProgress` / `cancelControllerRef` to your existing state/refs. These names are examples; map to your real ones.

---

### B) `src/components/pages/SlideEditor.tsx` — *remove duplicate `useMemo`*

```tsx
// Keep one single memo with correct deps:
const imageTransform = useMemo(
  () => ({
    rotate180: rotateBg180,
    flipHorizontal: flipH,
  }),
  [rotateBg180, flipH]
);
```

---

### C) `src/hooks/useCanvasRender.ts` — *single rendering hook*

```ts
import { useCallback } from 'react';

export type TextLine = {
  text: string;
  x: number;
  y: number;
  font: string;
  fill?: string;
  stroke?: { color: string; width: number };
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  maxWidth?: number;
};

export type SlideInput = {
  image: HTMLImageElement | ImageBitmap | OffscreenCanvas;
  width: number;
  height: number;
  text?: TextLine[];
};

export function useCanvasRender() {
  const renderSlideToCanvas = useCallback(async (canvas: HTMLCanvasElement, slide: SlideInput) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = slide.width;
    canvas.height = slide.height;

    // draw base image
    ctx.drawImage(slide.image as any, 0, 0, slide.width, slide.height);

    // draw text
    for (const line of slide.text ?? []) {
      ctx.save();
      ctx.font = line.font;
      ctx.textAlign = line.align ?? 'left';
      ctx.textBaseline = line.baseline ?? 'alphabetic';
      if (line.stroke) {
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.lineWidth = line.stroke.width;
        ctx.strokeStyle = line.stroke.color;
        ctx.strokeText(line.text, line.x, line.y, line.maxWidth);
      }
      ctx.fillStyle = line.fill ?? '#fff';
      ctx.fillText(line.text, line.x, line.y, line.maxWidth);
      ctx.restore();
    }
  }, []);

  const renderSlideToBlob = useCallback(async (slide: SlideInput, mime: string = 'image/png') => {
    const canvas = document.createElement('canvas');
    await renderSlideToCanvas(canvas, slide);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime));
  }, [renderSlideToCanvas]);

  return { renderSlideToCanvas, renderSlideToBlob };
}

export default useCanvasRender;
```

---

### D) `src/lib/render/SlideRenderer.ts` — *orchestrator used by Step 3*

```ts
import useCanvasRender, { type SlideInput } from '../../hooks/useCanvasRender';

export type GenerateSlidesOptions = {
  slides: SlideInput[];
  concurrency?: number;
  onProgress?: (p: { completed: number; total: number }) => void;
  signal?: AbortSignal;
};

export async function generateSlides(opts: GenerateSlidesOptions) {
  const { slides, concurrency = 2, onProgress, signal } = opts;
  const total = slides.length;
  let completed = 0;

  const queue = slides.slice();
  const results: (Blob | null)[] = new Array(total);

  // tiny worker
  const worker = async () => {
    const { renderSlideToBlob } = useCanvasRender();
    while (queue.length) {
      if (signal?.aborted) return;
      const idx = total - queue.length;
      const slide = queue.shift()!;
      const blob = await renderSlideToBlob(slide);
      results[idx] = blob;
      completed++;
      onProgress?.({ completed, total });
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
  await Promise.all(workers);

  return results;
}

export default generateSlides;
```

---

### E) `src/lib/images/thumbnail.ts` — *preview helper*

```ts
import { type SlideInput } from '../render/SlideRenderer';
import useCanvasRender from '../../hooks/useCanvasRender';

export async function buildThumbnail(slide: SlideInput, max = 320) {
  const ratio = Math.min(max / slide.width, max / slide.height);
  const w = Math.round(slide.width * ratio);
  const h = Math.round(slide.height * ratio);

  const { renderSlideToBlob } = useCanvasRender();
  const blob = await renderSlideToBlob({ ...slide, width: w, height: h });
  return blob;
}
```

---

## 🔌 Where to call what (no UI changes)

- Existing “Generate All” button/handler → call `generateAllDrafts()` which now wraps `generateSlides(opts)`.
- When a slide finishes rendering, if you need a UI preview, call `buildThumbnail(slide)` and set the preview URL.
- Keep **every** DOM/className **exactly** as is.

---

## 🧪 Verify locally

```bash
npm run typecheck
npm run lint
npm run dev
```

If you have a `tsconfig.json` baseUrl/paths for `@/`, you may prefer:

```ts
import { generateSlides } from '@/lib/render/SlideRenderer'
import useCanvasRender from '@/hooks/useCanvasRender'
```

Otherwise, keep the relative imports shown above.

---

## 🗣️ One‑shot prompt for Codex/Cursor

Copy‑paste this as a single message:

> **Task:** Apply a surgical fix to PR #6 without altering UI.  
> **Do:**  
> 1) In `src/components/pages/GeneratePage.tsx`, add a `startGeneration()` wrapper that calls `generateSlides(...)` from `src/lib/render/SlideRenderer.ts`. Add thin wrappers for `handleRandomCaption` and `handleRandomImage` that delegate to existing logic if present; otherwise no‑ops. Keep all JSX and styling unchanged.  
> 2) In `src/components/pages/SlideEditor.tsx`, remove the duplicate `useMemo` for `imageTransform`; keep a single memo with deps `[rotateBg180, flipH]`.  
> 3) Create `src/hooks/useCanvasRender.ts` exposing `renderSlideToCanvas` and `renderSlideToBlob` with proper ctx guards (set canvas width/height before drawing).  
> 4) Create `src/lib/render/SlideRenderer.ts` implementing `generateSlides(opts)` with a tiny worker pool and progress callback, reusing `useCanvasRender`.  
> 5) Create `src/lib/images/thumbnail.ts` with `buildThumbnail(slide, max = 320)` that renders via the same pipeline.  
> 6) Fix imports (`@/` vs relative) according to the project config.  
> Run `npm run typecheck && npm run dev` and report any remaining type/import errors without modifying UI.
```

---

## ✅ Checklist (tick as you go)

- [ ] GeneratePage: `startGeneration` wrapper added, dangling calls resolved
- [ ] SlideEditor: duplicate `useMemo` removed
- [ ] `useCanvasRender` implemented and imported where needed
- [ ] `SlideRenderer` orchestrator implemented; progress wired
- [ ] `thumbnail` helper implemented
- [ ] Typecheck/lint/dev run clean, no UI diffs

---

### Notes for maintainers
- If you later relocate the render code to a service/worker, keep this API stable so the page layer remains unchanged.
- If you already have a randomizer service, wire the `handleRandom*` wrappers to it and then delete the wrappers after migrating call sites.
