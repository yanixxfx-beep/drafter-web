// src/lib/render/SlideRenderer.ts
import type { Slide } from '@/types/slide'

export interface RenderOptions {
  slide: Slide
  scale: number
  dpr?: number
}

export async function renderSlideToCanvas({ slide, scale, dpr = 1 }: RenderOptions): Promise<HTMLCanvasElement> {
  // Wait for fonts to be ready
  await document.fonts.ready
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  // Set canvas size
  canvas.width = slide.exportSize.w * scale * dpr
  canvas.height = slide.exportSize.h * scale * dpr
  
  // Set transform for high DPI
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  
  // Enable image smoothing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  // Draw background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, slide.exportSize.w * scale, slide.exportSize.h * scale)
  
  // Draw image if available
  if (slide.imageRef) {
    try {
      // For now, we'll use a placeholder since we need to handle different image sources
      // In a real implementation, you'd load the image based on imageRef
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      // Use thumbUrl if available, otherwise create a placeholder
      const imageUrl = slide.thumbUrl || '/assets/logo/logo_drafter_transparent.png'
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })
      
      // Draw image to cover the canvas
      const imgAspect = img.width / img.height
      const canvasAspect = (slide.exportSize.w * scale) / (slide.exportSize.h * scale)
      
      let drawWidth = slide.exportSize.w * scale
      let drawHeight = slide.exportSize.h * scale
      let drawX = 0
      let drawY = 0
      
      if (imgAspect > canvasAspect) {
        // Image is wider, fit height
        drawWidth = drawHeight * imgAspect
        drawX = (slide.exportSize.w * scale - drawWidth) / 2
      } else {
        // Image is taller, fit width
        drawHeight = drawWidth / imgAspect
        drawY = (slide.exportSize.h * scale - drawHeight) / 2
      }
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
    } catch (error) {
      console.warn('Failed to load image:', error)
    }
  }
  
  // Draw text layers if available
  if (slide.textLayers && slide.textLayers.length > 0) {
    for (const layer of slide.textLayers) {
      ctx.fillStyle = layer.color || '#FFFFFF'
      ctx.font = `${layer.size * scale}px ${layer.font}`
      ctx.textAlign = layer.align
      ctx.textBaseline = 'middle'
      
      const textX = layer.x * scale
      const textY = layer.y * scale
      
      // Draw text with stroke if specified
      if (layer.stroke) {
        ctx.strokeStyle = layer.stroke.color
        ctx.lineWidth = layer.stroke.width * scale
        ctx.strokeText(layer.text, textX, textY)
      }
      
      ctx.fillText(layer.text, textX, textY)
    }
  }
  
  return canvas
}