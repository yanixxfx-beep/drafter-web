// src/lib/export/ExportManager.ts
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'
import { PerformanceMonitor } from '@/lib/performance/PerformanceMonitor'
import { MemoryManager } from '@/lib/memory/MemoryManager'
import type { Slide } from '@/types/slide'

export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp'
  quality?: number
  scale?: number
  includeMetadata?: boolean
}

export interface ExportProgress {
  total: number
  completed: number
  current: string
  eta: number
}

export class ExportManager {
  private static instance: ExportManager
  private performanceMonitor = PerformanceMonitor.getInstance()
  private memoryManager = MemoryManager.getInstance()
  
  static getInstance(): ExportManager {
    if (!ExportManager.instance) {
      ExportManager.instance = new ExportManager()
    }
    return ExportManager.instance
  }
  
  // Export single slide
  async exportSlide(
    slide: Slide, 
    options: ExportOptions = { format: 'png', scale: 1 }
  ): Promise<Blob> {
    const endTiming = this.performanceMonitor.startTiming('export_slide')
    
    try {
      const canvas = await renderSlideToCanvas({ 
        slide, 
        scale: options.scale || 1 
      })
      
      const mimeType = `image/${options.format}`
      const quality = options.quality || (options.format === 'png' ? 1 : 0.92)
      
      const blob = await new Promise<Blob>(resolve => 
        canvas.toBlob(b => resolve(b!), mimeType, quality)
      )
      
      endTiming()
      return blob
    } catch (error) {
      endTiming()
      throw new Error(`Failed to export slide: ${error}`)
    }
  }
  
  // Export multiple slides as ZIP
  async exportSlidesAsZip(
    slides: Slide[],
    options: ExportOptions = { format: 'png', scale: 1 },
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> {
    const endTiming = this.performanceMonitor.startTiming('export_zip')
    
    try {
      // Dynamic import for JSZip to reduce bundle size
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      const startTime = Date.now()
      const total = slides.length
      
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i]
        
        // Update progress
        if (onProgress) {
          const elapsed = Date.now() - startTime
          const eta = total > 0 ? (elapsed / (i + 1)) * (total - i - 1) : 0
          
          onProgress({
            total,
            completed: i,
            current: slide.id,
            eta: Math.round(eta / 1000)
          })
        }
        
        try {
          const blob = await this.exportSlide(slide, options)
          const fileName = `${slide.id}.${options.format}`
          
          // Add metadata if requested
          if (options.includeMetadata) {
            const metadata = {
              id: slide.id,
              text: slide.textLayers[0]?.text || '',
              exportSize: slide.exportSize,
              createdAt: new Date(slide.updatedAt).toISOString()
            }
            
            zip.file(`${slide.id}_metadata.json`, JSON.stringify(metadata, null, 2))
          }
          
          zip.file(fileName, blob)
        } catch (error) {
          console.warn(`Failed to export slide ${slide.id}:`, error)
        }
        
        // Cleanup memory periodically
        if (i % 10 === 0) {
          this.memoryManager.monitorAndCleanup()
        }
      }
      
      // Generate ZIP
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })
      
      endTiming()
      return zipBlob
    } catch (error) {
      endTiming()
      throw new Error(`Failed to export ZIP: ${error}`)
    }
  }
  
  // Export slides grouped by sheet
  async exportSlidesBySheet(
    slidesBySheet: Record<string, Slide[]>,
    options: ExportOptions = { format: 'png', scale: 1 },
    onProgress?: (progress: ExportProgress & { sheet: string }) => void
  ): Promise<Blob> {
    const endTiming = this.performanceMonitor.startTiming('export_sheets_zip')
    
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      const sheetNames = Object.keys(slidesBySheet)
      let totalSlides = 0
      let completedSlides = 0
      
      // Calculate total slides
      for (const slides of Object.values(slidesBySheet)) {
        totalSlides += slides.length
      }
      
      for (const sheetName of sheetNames) {
        const slides = slidesBySheet[sheetName]
        const sheetFolder = zip.folder(sheetName)
        
        if (!sheetFolder) continue
        
        for (const slide of slides) {
          try {
            const blob = await this.exportSlide(slide, options)
            const fileName = `${slide.id}.${options.format}`
            
            sheetFolder.file(fileName, blob)
            
            completedSlides++
            
            if (onProgress) {
              onProgress({
                total: totalSlides,
                completed: completedSlides,
                current: slide.id,
                eta: 0, // Calculate if needed
                sheet: sheetName
              })
            }
          } catch (error) {
            console.warn(`Failed to export slide ${slide.id}:`, error)
          }
        }
      }
      
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })
      
      endTiming()
      return zipBlob
    } catch (error) {
      endTiming()
      throw new Error(`Failed to export sheets ZIP: ${error}`)
    }
  }
  
  // Download blob as file
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    this.memoryManager.trackObjectUrl(url)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Cleanup after a delay
    setTimeout(() => {
      this.memoryManager.cleanupObjectUrl(url)
    }, 1000)
  }
  
  // Get export statistics
  getExportStats(): Record<string, number> {
    return this.performanceMonitor.getAllMetrics()
  }
  
  // Cleanup resources
  cleanup(): void {
    this.memoryManager.cleanupAll()
  }
}
