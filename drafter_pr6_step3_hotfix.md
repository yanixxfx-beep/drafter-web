# Drafter — PR #6 Step‑3 Hotfix & Stabilization Plan
_Last updated: 2025-10-27 19:10_

> **Scope:** This plan targets **PR #6** with commits **54b95ed** (Step‑3 fixes: thumbnail queue, SlideRenderer, useCanvasRenderV2) and **2e841b7** (Build error analysis for `GeneratePage.tsx`). It **keeps your UI intact** and applies **surgical fixes** so Cursor/Codex can proceed safely.

---

## 0) What’s actually in these commits (context)
- **54b95ed** adds:
  - Guardrails + plan files (`CODEX_GUARDRAILS.md`, `CODEX_STEP3_GUARDRAILS.md`, `STEP3_FIXES_PLAN.md`)
  - New render pipeline files:  
    `src/hooks/useCanvasRender.ts` (V2), `src/lib/render/SlideRenderer.ts`, `src/lib/render/caption.ts`, `src/lib/images/thumbnail.ts`  
  - Step panes extraction: `src/components/generate/parts/Step2Pane.tsx`, `Step3Pane.tsx`  
  - Editor/canvas updates: `src/components/SlideEditorCanvas.tsx`, `src/components/pages/SlideEditor.tsx`
- **2e841b7** documents a **parse error in `GeneratePage.tsx`** (stray `}` / unmatched braces around the early return for session creation + main return).

**Refs:** See the commit pages and file lists noted in GitHub.  

---

## 1) Guardrails (don’t let Cursor change these)
- **ZERO UI changes.** Do not modify styles, layout, tokens, spacing, or visual behavior.
- **No big rewrites.** Only re‑wire/patch the files touched by 54b95ed and the build error in 2e841b7.
- **Preserve prop shapes.** If renaming is required to connect new helpers, add adapters not breaking callers.
- **Client‑only where needed.** Any code touching `window`, `document`, `<canvas>`, `ImageBitmap` must be `"use client"` or `dynamic(..., { ssr:false })`.
- **TypeScript first.** Add/keep types for slide/text/canvas render options.

---

## 2) Immediate build fix — `GeneratePage.tsx` unmatched braces
**Symptom (from 2e841b7):** `Expected '}', got '<eof>'` near lines ~1647 and ~1827. That file now has:
- An **early return** for the session creation panel **plus**
- The **main return** of the component — but a **stray `}`** sits between them, breaking the parser.

### Fix (surgical)
1) Ensure structure follows:
```tsx
export function GeneratePage() {
  // ... state + helpers + local render fns ...

  if (showSessionCreation) {
    return (
      <div className="h-full overflow-y-auto">
        {/* session creation UI (was Step 2.5 panel) */}
      </div>
    );
  } // only closes the IF, not the component

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        {/* Main Generate UI */}
      </div>
    </div>
  );
} // closes component
```
2) **Delete the orphan `}`** that sits right after the early return block.  
3) Verify **every local `renderStepX` function** is either:
   - **Pure function returning JSX** and closed before the early return, or
   - Inlined as JSX inside either the early return or the main return.

> **Tip:** Ask Cursor to _only_ adjust braces and returns. No JSX moves, no style changes.

---

## 3) Wire in the new Step‑3 pipeline without changing UI
You already have the new files from 54b95ed. Connect them minimally:

### 3.1 Thumbnails (use the queue)
- Import `thumbnail` helper: `src/lib/images/thumbnail.ts`.
- Wherever thumbnails are derived, **replace ad‑hoc canvas draws** with the helper.
- **Trigger refresh** by bumping a `version`/nonce on slide changes (randomize, text, crop).

### 3.2 Unified renderer for main canvas
- Use `src/lib/render/SlideRenderer.ts` inside your `SlideEditorCanvas.tsx` (already added) and any export routines.
- Make sure the renderer **sets DPR transform** and matches your logical width/height so exports aren’t grey/misaligned.

### 3.3 Hook upgrade
- Migrate canvas update effects to `useCanvasRender.ts` (V2).  
- Ensure parent is `"use client"`; if not, import render components with `dynamic(..., { ssr:false })`.

**Do not alter** visible behavior; only change **where** the drawing happens.

---

## 4) Minimal file map to stabilize
Keep your existing names; just confirm existence and usage:

```
src/components/pages/GeneratePage.tsx        ← fix braces; keep as orchestrator
src/components/pages/SlideEditor.tsx         ← uses SlideEditorCanvas + UI controls
src/components/SlideEditorCanvas.tsx         ← calls unified SlideRenderer
src/components/generate/parts/Step2Pane.tsx  ← image workflows
src/components/generate/parts/Step3Pane.tsx  ← text/slide controls & exports

src/hooks/useCanvasRender.ts                 ← V2 render hook (reuse it)
src/lib/render/SlideRenderer.ts              ← single source of truth for drawing
src/lib/render/caption.ts                    ← text layout helpers
src/lib/images/thumbnail.ts                  ← thumbnail queue/refresh
```

---

## 5) Export path (fix grey/misaligned)
- **Never snapshot** a canvas that hasn’t finished drawing. Await image decode → draw → toBlob.
- For each export:
  1. Create a **fresh, offscreen canvas** at slide logical `w × h`.
  2. Run **SlideRenderer** (it applies DPR internally).
  3. Use `canvas.toBlob("image/png", 1)`.

> If assets are remote, set `img.crossOrigin = "anonymous"` and serve CORS headers. Local `ObjectURL`s should be revoked **after** export completes.

---

## 6) SSR/hydration safety
- Pages/components that render canvas must be **client components** (`"use client"`).
- If the page must stay server, load canvas pieces with `dynamic(..., { ssr:false })`.
- Avoid referencing `window`/`document` at module top‑level; do it inside effects.

---

## 7) Quick QA Checklist
- [ ] Build compiles after fixing braces in `GeneratePage.tsx`.
- [ ] Clicking **Randomize** changes both **main canvas and thumbnails**.
- [ ] **Exported PNGs** show the same image/text as editor (no grey frames, no offset).
- [ ] **No hydration warnings** on first render.
- [ ] **Retina/HiDPI** looks crisp.
- [ ] No UI regressions (layout, spacing, fonts untouched).

---

## 8) Cursor prompt (paste this)
**Title:** PR #6 Step‑3 hotfix — keep UI, fix braces, wire renderer

**Prompt:**  
> Keep the current UI exactly as is. In `src/components/pages/GeneratePage.tsx`, fix the unmatched braces by following the exact component structure in section 2 (delete any stray `}` after the early return, then close the component at the end). Do not change any JSX content or styling. Next, minimally wire the existing files from commit 54b95ed: use `src/lib/render/SlideRenderer.ts` in `SlideEditorCanvas.tsx` and in export routines; use the thumbnail queue in `src/lib/images/thumbnail.ts` for all thumbnails; keep `src/hooks/useCanvasRender.ts` (V2) for canvas updates. Ensure any canvas components are client‑side (`"use client"` or `dynamic(..., { ssr:false })`). No UI/UX changes, only wiring and the brace fix. Add a `version`/nonce bump on slide change to trigger thumbnail refresh.

---

## 9) If something still fails
- Send me the **current `GeneratePage.tsx`** (only the header → early return → main return region) and **any stack trace**. I’ll generate a **patch‑ready diff** you can paste into Cursor.

---

### References inside the PR (what this plan is based on)
- Build error notes (unmatched braces in `GeneratePage.tsx`, plus the new files list) are summarized from your commit pages for **2e841b7** and **54b95ed**.
