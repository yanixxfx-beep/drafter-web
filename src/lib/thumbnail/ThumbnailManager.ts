// src/lib/thumbnail/ThumbnailManager.ts
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'
import { enqueueThumb, cleanupThumb } from '@/lib/images/thumbnail'
import type { Slide } from '@/types/slide'

export class ThumbnailManager {
  private static instance: ThumbnailManager
  private thumbnails: Map<string, string> = new Map()
  private pendingThumbnails: Set<string> = new Set()
  
  static getInstance(): ThumbnailManager {
    if (!ThumbnailManager.instance) {
      ThumbnailManager.instance = new ThumbnailManager()
    }
    return ThumbnailManager.instance
  }
  
  // Generate thumbnail for a slide
  async generateThumbnail(slide: Slide, targetWidth = 216): Promise<string | null> {
    if (this.thumbnails.has(slide.id)) {
      return this.thumbnails.get(slide.id)!
    }
    
    if (this.pendingThumbnails.has(slide.id)) {
      // Wait for pending thumbnail
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.thumbnails.has(slide.id)) {
            clearInterval(checkInterval)
            resolve(this.thumbnails.get(slide.id)!)
          }
        }, 100)
      })
    }
    
    this.pendingThumbnails.add(slide.id)
    
    try {
      const scale = targetWidth / slide.exportSize.w
      const canvas = await renderSlideToCanvas({ slide, scale })
      const blob = await new Promise<Blob>(resolve => 
        canvas.toBlob(b => resolve(b!), 'image/png', 0.92)
      )
      const url = URL.createObjectURL(blob)
      
      this.thumbnails.set(slide.id, url)
      this.pendingThumbnails.delete(slide.id)
      
      return url
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
      this.pendingThumbnails.delete(slide.id)
      return null
    }
  }
  
  // Get existing thumbnail
  getThumbnail(slideId: string): string | null {
    return this.thumbnails.get(slideId) || null
  }
  
  // Cleanup thumbnail
  cleanupThumbnail(slideId: string): void {
    const url = this.thumbnails.get(slideId)
    if (url) {
      URL.revokeObjectURL(url)
      this.thumbnails.delete(slideId)
    }
  }
  
  // Cleanup all thumbnails
  cleanupAll(): void {
    for (const [slideId, url] of this.thumbnails) {
      URL.revokeObjectURL(url)
    }
    this.thumbnails.clear()
    this.pendingThumbnails.clear()
  }
  
  // Batch generate thumbnails
  async generateThumbnails(slides: Slide[], targetWidth = 216): Promise<Map<string, string>> {
    const results = new Map<string, string>()
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 5
    for (let i = 0; i < slides.length; i += batchSize) {
      const batch = slides.slice(i, i + batchSize)
      
      const promises = batch.map(async (slide) => {
        const url = await this.generateThumbnail(slide, targetWidth)
        if (url) {
          results.set(slide.id, url)
        }
      })
      
      await Promise.all(promises)
      
      // Small delay between batches
      if (i + batchSize < slides.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return results
  }
  
  // Update slide and regenerate thumbnail
  async updateSlideThumbnail(slide: Slide, targetWidth = 216): Promise<string | null> {
    this.cleanupThumbnail(slide.id)
    return this.generateThumbnail(slide, targetWidth)
  }
}

