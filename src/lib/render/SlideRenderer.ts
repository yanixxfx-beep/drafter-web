// src/lib/render/SlideRenderer.ts
export interface Slide {
  id: string
  image: string
  text: string
  exportSize: { w: number; h: number }
  thumbUrl?: string
  _rev?: number
}

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
  if (slide.image) {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = slide.image
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
  
  // Draw text if available
  if (slide.text) {
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `${16 * scale}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const textX = (slide.exportSize.w * scale) / 2
    const textY = (slide.exportSize.h * scale) / 2
    
    // Simple text wrapping
    const words = slide.text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > slide.exportSize.w * scale * 0.8) {
        if (currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          lines.push(word)
        }
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    // Draw lines
    const lineHeight = 20 * scale
    const startY = textY - ((lines.length - 1) * lineHeight) / 2
    
    lines.forEach((line, index) => {
      ctx.fillText(line, textX, startY + index * lineHeight)
    })
  }
  
  return canvas
}