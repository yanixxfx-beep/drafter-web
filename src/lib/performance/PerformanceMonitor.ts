// src/lib/performance/PerformanceMonitor.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private memoryUsage: number[] = []
  private maxMemorySamples = 100
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  // Start timing an operation
  startTiming(operation: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, [])
      }
      
      const times = this.metrics.get(operation)!
      times.push(duration)
      
      // Keep only last 50 measurements
      if (times.length > 50) {
        times.shift()
      }
      
      console.log(`⏱️ ${operation}: ${duration.toFixed(2)}ms`)
    }
  }
  
  // Get average time for an operation
  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation)
    if (!times || times.length === 0) return 0
    
    return times.reduce((sum, time) => sum + time, 0) / times.length
  }
  
  // Get all metrics
  getAllMetrics(): Record<string, number> {
    const result: Record<string, number> = {}
    
    for (const [operation, times] of this.metrics) {
      result[operation] = this.getAverageTime(operation)
    }
    
    return result
  }
  
  // Monitor memory usage
  monitorMemory(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const used = memory.usedJSHeapSize / 1024 / 1024 // MB
      
      this.memoryUsage.push(used)
      
      if (this.memoryUsage.length > this.maxMemorySamples) {
        this.memoryUsage.shift()
      }
      
      // Log if memory usage is high
      if (used > 100) { // 100MB threshold
        console.warn(`⚠️ High memory usage: ${used.toFixed(2)}MB`)
      }
    }
  }
  
  // Get memory statistics
  getMemoryStats(): { current: number; average: number; max: number } {
    if (this.memoryUsage.length === 0) {
      return { current: 0, average: 0, max: 0 }
    }
    
    const current = this.memoryUsage[this.memoryUsage.length - 1]
    const average = this.memoryUsage.reduce((sum, usage) => sum + usage, 0) / this.memoryUsage.length
    const max = Math.max(...this.memoryUsage)
    
    return { current, average, max }
  }
  
  // Clear all metrics
  clear(): void {
    this.metrics.clear()
    this.memoryUsage = []
  }
  
  // Log performance summary
  logSummary(): void {
    console.log('📊 Performance Summary:')
    console.table(this.getAllMetrics())
    
    const memoryStats = this.getMemoryStats()
    console.log('🧠 Memory Usage:', memoryStats)
  }
}
