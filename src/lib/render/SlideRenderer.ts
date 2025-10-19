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
  if ((document as any).fonts?.ready) { 
    try { await (document as any).fonts.ready } catch {} 
  }

  // === DRAW PIPELINE ===
  // 1) Background & image
  await drawBackground(ctx, cssW, cssH)
  if (slide.imageRef) await drawImage(ctx, slide.imageRef, cssW, cssH, slide)

  // 2) Text layers (scale positions & sizes)
  for (const layer of slide.textLayers) {
    await drawTextLayer(ctx, layer, scale)
  }

  // 3) Watermark
  if (slide.watermark) await drawWatermark(ctx, slide.watermark, cssW, cssH, scale)

  return canvas
}

// ----- helpers -----
async function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

async function drawImage(ctx: CanvasRenderingContext2D, imageRef: Slide['imageRef'], w: number, h: number, slide: Slide) {
  try {
    ctx.save()
    
    // Apply background transformations
    if (slide.rotateBg180 || slide.flipH) {
      ctx.translate(w / 2, h / 2)
      if (slide.rotateBg180) ctx.rotate(Math.PI)
      if (slide.flipH) ctx.scale(-1, 1)
      ctx.translate(-w / 2, -h / 2)
    }
    
    // For now, draw a placeholder - in real implementation, this would load the actual image
    // from the imageRef (localId, bucket, key, etc.)
    ctx.fillStyle = '#333'
    ctx.fillRect(0, 0, w, h)
    
    // TODO: Implement actual image loading from imageRef
    // This would involve:
    // 1. Loading the image from local storage or cloud storage
    // 2. Drawing it with proper scaling (contain/cover)
    // 3. Handling different image formats and orientations
    
    ctx.restore()
  } catch (error) {
    console.error('Error drawing image:', error)
  }
}

async function drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer, scale: number) {
  const snap = (ctx as any)._snap || ((v: number) => v)
  const fontSize = layer.size * scale
  ctx.save()
  ctx.font = `${fontSize}px ${layer.font}`
  ctx.fillStyle = layer.color
  ctx.textAlign = layer.align
  if (layer.stroke) { 
    ctx.lineWidth = (layer.stroke.width || 1) * scale
    ctx.strokeStyle = layer.stroke.color 
  }

  // Draw text with stroke if needed
  const x = snap(layer.x * scale)
  const y = snap(layer.y * scale)
  if (layer.stroke) ctx.strokeText(layer.text, x, y)
  ctx.fillText(layer.text, x, y)
  ctx.restore()
}

async function drawWatermark(ctx: CanvasRenderingContext2D, wm: Slide['watermark'], w: number, h: number, scale: number) {
  if (!wm?.text) return
  
  ctx.save()
  ctx.font = `${(wm.size || 24) * scale}px Arial`
  ctx.fillStyle = wm.color || '#FFFFFF'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  
  const padding = (wm.padding || 20) * scale
  const x = w - padding
  const y = h - padding
  
  ctx.fillText(wm.text, x, y)
  ctx.restore()
}