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