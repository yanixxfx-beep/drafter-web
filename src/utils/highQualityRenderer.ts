// High-quality export renderer with 2× supersampling and professional font rendering
// Based on ChatGPT's recommendations for 8-9/10 visual quality

import { FontRenderer, FontStyle } from './fontRenderer'

export interface ExportJob {
  id: string
  imageUrl: string
  caption: string
  style: FontStyle
}

export interface ExportResult {
  id: string
  blob: Blob
  canvas: HTMLCanvasElement
}

/**
 * High-quality image cover drawing (no distortion)
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D, 
  img: ImageBitmap | HTMLImageElement, 
  width: number, 
  height: number
): void {
  const iw = (img as any).width
  const ih = (img as any).height
  const s = Math.max(width / iw, height / ih)
  const dw = iw * s
  const dh = ih * s
  const dx = (width - dw) / 2
  const dy = (height - dh) / 2
  ctx.drawImage(img as any, dx, dy, dw, dh)
}

/**
 * Render a single slide with 2× supersampling for export quality
 */
export async function renderHighQualitySlide(job: ExportJob): Promise<ExportResult> {
  const OUT_W = 1080
  const OUT_H = 1920
  const SS = 2 // 2× supersampling
  
  // Create high-resolution canvas
  const cvsHi = new OffscreenCanvas(OUT_W * SS, OUT_H * SS)
  const hi = cvsHi.getContext('2d', { alpha: true })!
  
  // Scale the context for logical sizing
  hi.scale(SS, SS)
  hi.imageSmoothingEnabled = true
  hi.imageSmoothingQuality = 'high'
  
  // Load background image with EXIF orientation support
  const img = new Image()
  img.crossOrigin = 'anonymous'
  
  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        // Use createImageBitmap for EXIF orientation support
        const bmp = await createImageBitmap(img, { 
          imageOrientation: 'from-image' as any 
        })
        
        // Draw background image (cover without distortion)
        drawImageCover(hi, bmp, OUT_W, OUT_H)
        
        // Ensure font is loaded
        await document.fonts.load(`${job.style.fontChoice === 'SemiBold' ? '600' : job.style.fontChoice === 'Medium' ? '500' : '400'} 52px "TikTok Sans"`)
        
        // Set font for rendering
        const weight = job.style.fontChoice === 'SemiBold' ? '600' : job.style.fontChoice === 'Medium' ? '500' : '400'
        hi.font = `${weight} ${job.style.fontSize}px "TikTok Sans", Arial, sans-serif`
        hi.textAlign = 'center'
        hi.textBaseline = 'alphabetic'
        
        // Render text with circular outline
        const fontRenderer = new FontRenderer()
        fontRenderer.renderText(cvsHi as any, job.caption, job.style, OUT_W / 2, OUT_H / 2)
        
        // Downsample to final resolution - use regular HTMLCanvasElement for display
        const cvs = document.createElement('canvas')
        cvs.width = OUT_W
        cvs.height = OUT_H
        const ctx = cvs.getContext('2d')!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(cvsHi, 0, 0, OUT_W, OUT_H)
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
          cvs.toBlob((blob) => resolve(blob!), 'image/png')
        })
        
        // Clean up
        if ('close' in bmp) {
          bmp.close()
        }
        fontRenderer.cleanup()
        
        resolve({
          id: job.id,
          blob,
          canvas: cvs
        })
        
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = job.imageUrl
  })
}

/**
 * Batch render multiple slides with OffscreenCanvas in Web Worker
 */
export async function renderBatchSlides(jobs: ExportJob[]): Promise<ExportResult[]> {
  const results: ExportResult[] = []
  
  // Process in batches to avoid memory issues
  const batchSize = 5
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(job => renderHighQualitySlide(job))
    )
    results.push(...batchResults)
  }
  
  return results
}

/**
 * Check if OffscreenCanvas and createImageBitmap are supported
 */
export function supportsHighQualityRendering(): boolean {
  return typeof OffscreenCanvas !== 'undefined' && 
         typeof createImageBitmap !== 'undefined'
}

/**
 * Fallback renderer for browsers without OffscreenCanvas support
 */
export async function renderFallbackSlide(job: ExportJob): Promise<ExportResult> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')!
  
  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  // Load background image
  const img = new Image()
  img.crossOrigin = 'anonymous'
  
  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        // Draw background image
        drawImageCover(ctx, img, 1080, 1920)
        
        // Render text with font renderer
        const fontRenderer = new FontRenderer()
        fontRenderer.renderText(canvas, job.caption, job.style, 540, 960)
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png')
        })
        
        fontRenderer.cleanup()
        
        resolve({
          id: job.id,
          blob,
          canvas
        })
        
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = job.imageUrl
  })
}
