import { drawCover } from "@/utils/image"
import { layoutDesktop } from "@/lib/textLayout"

export type BasicTextLayer = {
  text: string
  font?: string
  size?: number
  lineHeight?: number
  color?: string
  stroke?: { color: string; width: number }
  x?: number
  y?: number
}

export type BasicSlide = {
  exportSize: { w: number; h: number }
  backgroundColor?: string
  imageRef?: string | null
  imageTransform?: {
    rotate180?: boolean
    flipHorizontal?: boolean
  }
  textLayers?: BasicTextLayer[]
  watermark?: { text?: string }
}

export type CaptionSettings = {
  text: string
  layout: {
    fontFamily: string
    fontWeight: 400 | 500 | 600
    fontPx: number
    lineSpacingPx: number
    xOffsetPx: number
    yOffsetPx: number
    outlinePx: number
    align: 'top' | 'center' | 'bottom'
    horizontalAlign: 'left' | 'center' | 'right'
    textRotation: number
    safeMarginPx?: number
    maxTextWidthPx?: number
    useSafeZone?: boolean
    safeZoneFormat?: '9:16' | '3:4'
  }
  fillStyle?: string
  outlineColor?: string
}

export type RenderOpts = {
  slide: BasicSlide
  scale: number
  dpr?: number
  caption?: CaptionSettings
}

export async function renderSlideToCanvas({ slide, scale, dpr, caption }: RenderOpts): Promise<HTMLCanvasElement> {
  const { w: baseW, h: baseH } = slide.exportSize
  const cssW = Math.max(1, Math.round(baseW * scale))
  const cssH = Math.max(1, Math.round(baseH * scale))
  const _dpr = dpr ?? (globalThis.devicePixelRatio || 1)
  const compositeScale = _dpr * scale

  const canvas = document.createElement("canvas")
  canvas.width = Math.round(cssW * _dpr)
  canvas.height = Math.round(cssH * _dpr)
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`

  const ctx = canvas.getContext("2d", { alpha: true })
  if (!ctx) {
    return canvas
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(compositeScale, 0, 0, compositeScale, 0, 0)
  ctx.imageSmoothingEnabled = true
  if ("imageSmoothingQuality" in ctx) {
    ctx.imageSmoothingQuality = "high"
  }
  ctx.textBaseline = "alphabetic"

  if ((document as any).fonts?.ready) {
    try {
      await (document as any).fonts.ready
    } catch {}
  }

  await drawBackground(ctx, baseW, baseH, slide.backgroundColor)

  if (slide.imageRef) {
    await drawImage(ctx, slide.imageRef, baseW, baseH, slide.imageTransform)
  }

  if (Array.isArray(slide.textLayers)) {
    for (const layer of slide.textLayers) {
      await drawTextLayer(ctx, layer)
    }
  }

  if (caption && caption.text) {
    drawCaptionLayer(ctx, caption, baseW, baseH)
  }

  if (slide.watermark?.text) {
    await drawWatermark(ctx, slide.watermark.text, baseW, baseH)
  }

  return canvas
}

async function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, backgroundColor?: string | null) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = backgroundColor || "#000000"
  ctx.fillRect(0, 0, w, h)
}

async function drawImage(
  ctx: CanvasRenderingContext2D,
  imageRef: string,
  w: number,
  h: number,
  transform?: { rotate180?: boolean; flipHorizontal?: boolean }
) {
  try {
    const img = await loadImage(imageRef)

    ctx.save()
    if (transform?.rotate180 || transform?.flipHorizontal) {
      ctx.translate(w / 2, h / 2)
      if (transform.rotate180) {
        ctx.rotate(Math.PI)
      }
      if (transform.flipHorizontal) {
        ctx.scale(-1, 1)
      }
      ctx.translate(-w / 2, -h / 2)
    }

    drawCover(ctx, img, w, h)
    ctx.restore()

    if ('close' in img && typeof (img as ImageBitmap).close === 'function') {
      try {
        ;(img as ImageBitmap).close()
      } catch {}
    }
  } catch (error) {
    console.warn("renderSlideToCanvas: failed to draw image", error)
  }
}

async function loadImage(src: string): Promise<HTMLImageElement | ImageBitmap> {
  const image = new Image()
  image.decoding = "async"
  image.crossOrigin = "anonymous"
  image.src = src
  await image.decode()

  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(image)
    } catch {}
  }

  return image
}

async function drawTextLayer(ctx: CanvasRenderingContext2D, layer: BasicTextLayer) {
  if (!layer.text) return
  const fontSize = layer.size ?? 48
  const fontFamily = layer.font ?? "Inter"
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.fillStyle = layer.color ?? "#FFFFFF"
  const x = layer.x ?? 0
  const y = layer.y ?? fontSize
  if (layer.stroke && layer.stroke.width > 0) {
    ctx.lineWidth = layer.stroke.width
    ctx.strokeStyle = layer.stroke.color
    ctx.strokeText(layer.text, x, y)
  }
  ctx.fillText(layer.text, x, y)
}

async function drawWatermark(ctx: CanvasRenderingContext2D, text: string, w: number, h: number) {
  ctx.save()
  ctx.globalAlpha = 0.35
  ctx.font = "24px Inter"
  ctx.fillStyle = "#FFFFFF"
  ctx.textAlign = "right"
  ctx.fillText(text, w - 24, h - 24)
  ctx.restore()
}

function drawCaptionLayer(ctx: CanvasRenderingContext2D, caption: CaptionSettings, w: number, h: number) {
  if (!caption.text) return
  const layout = caption.layout
  const spec = {
    text: caption.text,
    fontFamily: layout.fontFamily,
    fontWeight: layout.fontWeight,
    fontPx: layout.fontPx,
    lineSpacingPx: layout.lineSpacingPx,
    yOffsetPx: layout.yOffsetPx,
    xOffsetPx: layout.xOffsetPx,
    align: layout.align,
    horizontalAlign: layout.horizontalAlign,
    textRotation: layout.textRotation,
    safeMarginPx: layout.safeMarginPx ?? 64,
    maxTextWidthPx: layout.maxTextWidthPx ?? w - 128,
    deskW: w,
    deskH: h,
    useSafeZone: layout.useSafeZone ?? false,
    safeZoneFormat: layout.safeZoneFormat
  }
  const layoutResult = layoutDesktop(ctx, spec)
  const textAlign =
    layout.horizontalAlign === 'left' ? 'left' : layout.horizontalAlign === 'right' ? 'right' : 'center'
  ctx.textAlign = textAlign
  ctx.save()
  ctx.translate(layoutResult.centerX, 0)
  ctx.rotate((layout.textRotation * Math.PI) / 180)

  layoutResult.lines.forEach((line, idx) => {
    const x = 0
    const y = layoutResult.baselines[idx]

    if (layout.outlinePx > 0) {
      ctx.strokeStyle = caption.outlineColor ?? "#000000"
      ctx.lineWidth = layout.outlinePx * 2
      ctx.lineJoin = "round"
      ctx.miterLimit = 2
      ctx.strokeText(line, x, y)
    }

    ctx.fillStyle = caption.fillStyle ?? "#FFFFFF"
    ctx.fillText(line, x, y)
  })

  ctx.restore()
}
