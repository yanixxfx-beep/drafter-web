// src/components/SlideEditorCanvas.tsx
import { useMemo, useRef } from 'react'
import { useCanvasRenderV2 } from '@/hooks/useCanvasRender'
import { drawCover, loadWithOrientation } from '@/utils/image'

type Size = { width: number; height: number }

type Props = {
  src?: string
  bgColor?: string
  className?: string
  cssSize?: Size
  exportSize?: Size
  dpr?: number
  drawOverlay?: (ctx: CanvasRenderingContext2D, cssW: number, cssH: number, dpr: number) => void | Promise<void>
  priority?: 'high' | 'low'
  imageTransform?: {
    rotate180?: boolean
    flipHorizontal?: boolean
  }
}

const DEFAULT_EXPORT_SIZE: Size = { width: 1080, height: 1920 }
const DEFAULT_CSS_SIZE: Size = { width: 360, height: 640 }

export default function SlideEditorCanvas({
  src,
  bgColor = '#000000',
  className,
  cssSize,
  exportSize,
  dpr,
  drawOverlay,
  imageTransform
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const targetCss = useMemo<Size>(() => {
    if (cssSize) return cssSize
    if (exportSize) {
      const scale = 1 / 3
      return { width: Math.round(exportSize.width * scale), height: Math.round(exportSize.height * scale) }
    }
    return DEFAULT_CSS_SIZE
  }, [cssSize, exportSize])

  useCanvasRenderV2({
    canvasRef,
    cssWidth: targetCss.width,
    cssHeight: targetCss.height,
    dpr,
    deps: [src, bgColor, drawOverlay, targetCss.width, targetCss.height],
    draw: async (ctx, cssW, cssH, ratio) => {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, cssW, cssH)

      if (src) {
        try {
          const image = await loadWithOrientation(src)
          ctx.save()
          if (imageTransform?.rotate180 || imageTransform?.flipHorizontal) {
            ctx.translate(cssW / 2, cssH / 2)
            if (imageTransform.rotate180) {
              ctx.rotate(Math.PI)
            }
            if (imageTransform.flipHorizontal) {
              ctx.scale(-1, 1)
            }
            ctx.translate(-cssW / 2, -cssH / 2)
          }

          drawCover(ctx, image, cssW, cssH)
          ctx.restore()

          if ('close' in image && typeof (image as ImageBitmap).close === 'function') {
            try {
              ;(image as ImageBitmap).close()
            } catch {}
          }
        } catch (error) {
          console.warn('SlideEditorCanvas: failed to load image', error)
        }
      }

      if (drawOverlay) {
        await drawOverlay(ctx, cssW, cssH, ratio)
      }
    }
  })

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: `${targetCss.width}px`,
        height: `${targetCss.height}px`
      }}
    />
  )
}
