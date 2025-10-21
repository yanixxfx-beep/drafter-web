// src/lib/memory/MemoryManager.ts
export class MemoryManager {
  private static instance: MemoryManager
  private objectUrls: Set<string> = new Set()
  private imageBitmaps: Set<ImageBitmap> = new Set()
  private canvases: Set<HTMLCanvasElement> = new Set()
  
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }
  
  // Track object URL for cleanup
  trackObjectUrl(url: string): void {
    this.objectUrls.add(url)
  }
  
  // Track image bitmap for cleanup
  trackImageBitmap(bitmap: ImageBitmap): void {
    this.imageBitmaps.add(bitmap)
  }
  
  // Track canvas for cleanup
  trackCanvas(canvas: HTMLCanvasElement): void {
    this.canvases.add(canvas)
  }
  
  // Cleanup object URL
  cleanupObjectUrl(url: string): void {
    if (this.objectUrls.has(url)) {
      URL.revokeObjectURL(url)
      this.objectUrls.delete(url)
    }
  }
  
  // Cleanup image bitmap
  cleanupImageBitmap(bitmap: ImageBitmap): void {
    if (this.imageBitmaps.has(bitmap)) {
      bitmap.close()
      this.imageBitmaps.delete(bitmap)
    }
  }
  
  // Cleanup canvas
  cleanupCanvas(canvas: HTMLCanvasElement): void {
    if (this.canvases.has(canvas)) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      this.canvases.delete(canvas)
    }
  }
  
  // Cleanup all tracked resources
  cleanupAll(): void {
    // Cleanup object URLs
    for (const url of this.objectUrls) {
      URL.revokeObjectURL(url)
    }
    this.objectUrls.clear()
    
    // Cleanup image bitmaps
    for (const bitmap of this.imageBitmaps) {
      bitmap.close()
    }
    this.imageBitmaps.clear()
    
    // Cleanup canvases
    for (const canvas of this.canvases) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    this.canvases.clear()
  }
  
  // Get memory usage statistics
  getMemoryStats(): {
    objectUrls: number
    imageBitmaps: number
    canvases: number
    total: number
  } {
    return {
      objectUrls: this.objectUrls.size,
      imageBitmaps: this.imageBitmaps.size,
      canvases: this.canvases.size,
      total: this.objectUrls.size + this.imageBitmaps.size + this.canvases.size
    }
  }
  
  // Force garbage collection (if available)
  forceGC(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
    }
  }
  
  // Monitor memory usage and cleanup if needed
  monitorAndCleanup(): void {
    const stats = this.getMemoryStats()
    
    // Cleanup if we have too many resources
    if (stats.total > 100) {
      console.warn('🧹 Cleaning up memory resources...')
      this.cleanupAll()
      this.forceGC()
    }
  }
}

