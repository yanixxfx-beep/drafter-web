# Drafter — Generate Flow: Fixes, Improvements & Features (Cursor Plan)

**Purpose:** Implement the exact fixes and features discussed for Step 1 → Step 2 → Step 3. This plan is **Cursor-ready** and includes code scaffolds. Keep OPFS as default; Cloud is optional via toggle.

---

## High‑level goals

* **Instant thumbnails** when opening Step 3 (no click-to-render).
* **Thumbnail = scaled export** (single renderer, pixel‑consistent).
* **Crisp text** (DPR, font barrier, pixel snapping; TikTok‑like look).
* **Editor parity**: Step‑3 editor **is the same** as Step‑2.
* **Multi‑sheet selection** + global/per‑sheet settings + **ZIP per sheet** export.
* **Smooth performance** with 50–200 slides.

---

## Types & state (augment)

```ts
// src/types/slide.ts
export type ImageRef = { kind: 'local'|'cloud'; localId?: string; bucket?: 'user'|'system'; key?: string };

export type TextLayer = {
  id: string; kind: 'title'|'subtitle'|'cta'; text: string;
  x: number; y: number; w: number; h: number;
  align: CanvasTextAlign; font: string; size: number; lineHeight: number;
  color: string; stroke?: { color: string; width: number };
};

export type Slide = {
  id: string; seed: string; _rev: number; updatedAt: number;
  exportSize: { w: number; h: number };
  imageRef: ImageRef;
  textLayers: TextLayer[];
  templateId?: string; watermark?: { text?: string; img?: ImageRef };
  // NEW for thumbs
  thumbUrl?: string | null;
};
```

---

## Fix Pack 1 — **Crisp text everywhere** via a single render hook

Centralize canvas setup: **fonts barrier**, **DPR transform**, **image smoothing**, **pixel snapping**.

```ts
// src/hooks/useCanvasRender.ts
import { useEffect, useRef } from 'react'

type Opts = {
  canvasRef: React.RefObject<HTMLCanvasElement>
  cssWidth: number
  cssHeight: number
  dpr?: number // default: window.devicePixelRatio
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number) => Promise<void> | void
  deps?: any[]
}

export function useCanvasRender({ canvasRef, cssWidth, cssHeight, dpr, draw, deps = [] }: Opts) {
  const tokenRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    const token = ++tokenRef.current

    const run = async () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const _dpr = dpr ?? (globalThis.devicePixelRatio || 1)
      // Ensure fonts are loaded once before any text render
      if ((document as any).fonts?.ready) {
        try { await (document as any).fonts.ready } catch {}
      }

      // Resize for HiDPI and apply DPR transform
      canvas.width = Math.max(1, Math.round(cssWidth * _dpr))
      canvas.height = Math.max(1, Math.round(cssHeight * _dpr))
      canvas.style.width = cssWidth + 'px'
      canvas.style.height = cssHeight + 'px'

      const ctx = canvas.getContext('2d', { alpha: true })
      if (!ctx) return
      ctx.setTransform(_dpr, 0, 0, _dpr, 0, 0)
      ctx.imageSmoothingEnabled = true
      // @ts-ignore
      if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high'
      ctx.textBaseline = 'alphabetic'

      // clear
      ctx.clearRect(0, 0, cssWidth, cssHeight)

      const drawSnap = (v: number) => Math.round(v * _dpr) / _dpr
      ;(ctx as any)._snap = drawSnap // optional: expose helper for inner logic

      if (!cancelled && tokenRef.current === token) {
        await draw(ctx, cssWidth, cssHeight, _dpr)
      }
    }

    run()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, cssWidth, cssHeight, dpr, ...deps])
}
```

**Usage:** both Step‑2 and Step‑3 editors (and any preview/thumbnail components) must use this hook so text looks identical everywhere.

---

## Fix Pack 2 — **One renderer** for export **and** thumbnails

Make a single renderer; change only the `scale`.

```ts
// src/lib/render/SlideRenderer.ts
import type { Slide, TextLayer } from '@/types/slide'

export type RenderOpts = {
  slide: Slide
  scale: number // 1 = export, <1 = thumbnail
  dpr?: number
}

export async function renderSlideToCanvas({ slide, scale, dpr }: RenderOpts): Promise<HTMLCanvasElement> {
  const { w: baseW, h: baseH } = slide.exportSize
  const cssW = Math.max(1, Math.round(baseW * scale))
  const cssH = Math.max(1, Math.round(baseH * scale))
  const _dpr = dpr ?? (globalThis.devicePixelRatio || 1)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(cssW * _dpr)
  canvas.height = Math.round(cssH * _dpr)
  canvas.style.width = cssW + 'px'
  canvas.style.height = cssH + 'px'

  const ctx = canvas.getContext('2d', { alpha: true })!
  ctx.setTransform(_dpr, 0, 0, _dpr, 0, 0)
  ctx.imageSmoothingEnabled = true
  // @ts-ignore
  if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high'
  ctx.textBaseline = 'alphabetic'

  // Ensure fonts are ready
  if ((document as any).fonts?.ready) { try { await (document as any).fonts.ready } catch {} }

  // === DRAW PIPELINE (use your existing logic here) ===
  // 1) Background & image
  await drawBackground(ctx, cssW, cssH)
  if (slide.imageRef) await drawImage(ctx, slide.imageRef, cssW, cssH)

  // 2) Text layers (scale positions & sizes)
  for (const layer of slide.textLayers) {
    await drawTextLayer(ctx, layer, scale)
  }

  // 3) Watermark
  if (slide.watermark) await drawWatermark(ctx, slide.watermark, cssW, cssH, scale)

  return canvas
}

// ----- helpers (replace with your real functions) -----
async function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); ctx.restore()
}

async function drawImage(ctx: CanvasRenderingContext2D, imageRef: Slide['imageRef'], w: number, h: number) {
  // implement your fit/cover logic; decode image before draw
  // const img = await loadImage(imageRef)
  // ctx.drawImage(img, 0, 0, w, h)
}

async function drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer, scale: number) {
  const snap = (ctx as any)._snap || ((v: number) => v)
  const fontSize = layer.size * scale
  ctx.save()
  ctx.font = `${fontSize}px ${layer.font}`
  ctx.fillStyle = layer.color
  ctx.textAlign = layer.align
  if (layer.stroke) { ctx.lineWidth = (layer.stroke.width || 1) * scale; ctx.strokeStyle = layer.stroke.color }

  // your measured lines here; below is simplified single-line example
  const x = snap(layer.x * scale)
  const y = snap(layer.y * scale)
  if (layer.stroke) ctx.strokeText(layer.text, x, y)
  ctx.fillText(layer.text, x, y)
  ctx.restore()
}

async function drawWatermark(ctx: CanvasRenderingContext2D, wm: Slide['watermark'], w: number, h: number, scale: number) {
  // position bottom-right with padding * scale
}
```

**Replace** any ad‑hoc canvas export/thumbnail code with `renderSlideToCanvas({ slide, scale })`. Export uses `scale=1`; thumbnails use `scale = targetThumbW / slide.exportSize.w`.

---

## Fix Pack 3 — **Instant thumbnails** via a queue

Pre‑render thumbs right after Generate; re‑render on edit/randomize.

```ts
// src/lib/images/thumbnail.ts
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'
import type { Slide } from '@/types/slide'

const MAX_CONCURRENCY = 3
let inFlight = 0
const q: Array<() => Promise<void>> = []

function pump() {
  if (inFlight >= MAX_CONCURRENCY) return
  const job = q.shift(); if (!job) return
  inFlight++
  job().finally(() => { inFlight--; pump() })
}

export function enqueueThumb(slide: Slide, targetWidth = 216) {
  q.push(async () => {
    const scale = targetWidth / slide.exportSize.w
    const canvas = await renderSlideToCanvas({ slide, scale })
    const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png', 0.92))
    const url = URL.createObjectURL(blob)
    // assign thumbUrl and bump revision
    slide.thumbUrl && URL.revokeObjectURL(slide.thumbUrl)
    slide.thumbUrl = url
    slide._rev = (slide._rev || 0) + 1
  })
  pump()
}
```

**Generate flow:** after you create slides for an idea, `slides.forEach(s => enqueueThumb(s))`. On edit/randomize of one slide, call `enqueueThumb(slide)` for that slide only.

UI: in the list/grid, render `<img src={slide.thumbUrl ?? placeholder}>` — no on‑click drawing.

---

## Fix Pack 4 — **Editor parity** (Step‑3 uses the same editor)

Make `SlideEditorCanvas` the single editor component, and remove the duplicate render call.

```diff
// src/components/SlideEditorCanvas.tsx (conceptual diff)
- useCanvasRender({ /* first call with inline options */ })
+ // REMOVE the first duplicate call. Keep only the memoized/renderOptions call below.

// Ensure this component accepts explicit sizing props
// <SlideEditorCanvas cssSize={{w:360,h:640}} exportSize={{w:1080,h:1920}} dpr={window.devicePixelRatio} .../>
```

Use **this same component** in Step‑2 and Step‑3 with identical props. Do not infer sizes from container CSS.

---

## Fix Pack 5 — Performance & stability

* **Queue thumbs** (above) to keep main thread responsive.
* For >100 slides, consider `requestIdleCallback` between thumbs or OffscreenCanvas in a Worker.
* **Cleanup:** when a slide image changes or you navigate away, `URL.revokeObjectURL(oldThumb)`; `bitmap.close()` if you use ImageBitmap.
* Avoid repeated logs in loops; prefer one concise debug line per action.

---

## Feature Pack A — **Multi‑sheet** selection & grouped export

**UX**

* Step‑1: spreadsheet picker allows **multi‑select** of sheets; show first 2–3 rows preview per sheet; confirm column mapping.
* Step‑2: toggle **Apply to all sheets** vs **Customize per sheet** (tabs/accordion). Same in Step‑2.5 (format/preferences).
* Step‑3: sidebar groups by **Sheet → Day**; click a day to view its slides.
* Export dialog: **Export all** → one ZIP **per sheet** (`<SpreadsheetName>_<Day>.zip`). Or **Custom** (select sheets/days/slides) → still grouped per sheet.

**Data**

```ts
// src/types/sheets.ts
export type SheetConfig = { sheetName: string; text: {/* settings */}; format: {/* size / template */} }
export type RunConfig = { applyMode: 'all'|'perSheet'; sheets: SheetConfig[] }
```

**Export (sketch)**

```ts
// src/lib/export/groupedZip.ts
// Pseudocode with JSZip; integrate with your existing ZIP tool
export async function exportBySheet(groups: Record<string, Slide[]>) {
  for (const [sheetName, slides] of Object.entries(groups)) {
    const zip = new JSZip()
    for (const s of slides) {
      const canvas = await renderSlideToCanvas({ slide: s, scale: 1 })
      const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png', 1))
      zip.file(`${s.id}.png`, blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadAs(`${sheetName}.zip`, zipBlob)
  }
}
```

---

## Feature Pack B — **Presets** for Step‑2

```ts
// src/data/presets.ts
export type TextPreset = {
  id: string; name: string
  font: string; size: number; lineHeight: number; color: string
  title?: Partial<TextLayer>; subtitle?: Partial<TextLayer>; cta?: Partial<TextLayer>
}

export const PRESETS: TextPreset[] = [
  { id:'clean', name:'Clean', font:'Inter', size:56, lineHeight:1.15, color:'#fff' },
  { id:'bold',  name:'Bold',  font:'Inter', size:64, lineHeight:1.05, color:'#fff' },
  // ...
]
```

UI: Preset list with small mini‑preview; buttons **Apply**, **Save as new**, **Reset**.

---

## Feature Pack C — **Re‑roll reproducibility**

Store `seed` per slide; pick image with a deterministic RNG so the same slide re‑roll is repeatable.

```ts
// src/lib/rand.ts
export function mulberry32(seedStr: string) {
  let h = 1779033703 ^ seedStr.length
  for (let i=0; i<seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h<<13) | (h>>>19) }
  return function() { h = Math.imul(h ^ (h>>>16), 2246822507); h = Math.imul(h ^ (h>>>13), 3266489909); const t = (h ^= h>>>16) >>> 0; return (t) / 4294967296 }
}

// usage
const rnd = mulberry32(slide.seed)
const idx = Math.floor(rnd() * images.length)
```

---

## Acceptance tests

* Open Step‑3 → **all thumbnails visible instantly**; no extra draw on click.
* Export vs thumbnail: **identical layout** (just scaled).
* Text is **crisp** (no blur/gray), baseline consistent.
* Step‑3 editor == Step‑2 editor visually and behaviorally.
* With 100 slides, UI stays responsive; memory doesn't balloon (URLs revoked when replaced).
* Multi‑sheet flow: selecting **All** generates, groups by sheet, and exports one ZIP per sheet.

---

## Cursor Execution Order

1. Implement Fix Pack 1: move DPR, font barrier, smoothing, snapping into `useCanvasRender` and ensure both editors use it.
2. Implement Fix Pack 2: add `src/lib/render/SlideRenderer.ts`; refactor any export/preview code to call it.
3. Implement Fix Pack 3: add `src/lib/images/thumbnail.ts` queue; after Generate, enqueue thumbs for all slides; on edit/randomize, re‑enqueue that slide.
4. Implement Fix Pack 4: remove duplicate `useCanvasRender` call in `SlideEditorCanvas.tsx`; make it the single editor used by Step‑2 and Step‑3 with explicit sizing props.
5. Wire the list UI to `slide.thumbUrl` (no on‑click drawing).
6. (Optional) Feature Pack A: multi‑sheet selection, per‑sheet configs, grouped export.
7. (Optional) Feature Pack B: presets in Step‑2.
8. Add simple tests: generate 50 slides; compare export vs thumbs; verify editor parity.

**Definition of Done:**

* Thumbnails instant; thumbnails == scaled export; crisp text across preview/export; one editor component; smooth with 50–100 slides; multi‑sheet & grouped export if in scope.
