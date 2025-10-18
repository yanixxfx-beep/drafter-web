import { ExportJob } from '@/workers/exportWorker'
import { downloadBlob } from './download'

export class WorkerExportManager {
  private worker: Worker | null = null
  private pendingJobs = new Map<string, {
    resolve: (blob: Blob) => void
    reject: (error: Error) => void
  }>()

  constructor() {
    this.initWorker()
  }

  private initWorker() {
    try {
      // Create worker from the export worker file
      this.worker = new Worker(new URL('../workers/exportWorker.ts', import.meta.url), {
        type: 'module'
      })
      
      this.worker.onmessage = (e: MessageEvent<{ id: string; blob?: Blob; error?: string }>) => {
        const { id, blob, error } = e.data
        const job = this.pendingJobs.get(id)
        
        if (job) {
          this.pendingJobs.delete(id)
          
          if (error) {
            job.reject(new Error(error))
          } else if (blob) {
            job.resolve(blob)
          } else {
            job.reject(new Error('No blob or error received'))
          }
        }
      }
      
      this.worker.onerror = (error) => {
        console.error('Worker error:', error)
        // Reject all pending jobs
        for (const [id, job] of this.pendingJobs) {
          job.reject(new Error('Worker error'))
        }
        this.pendingJobs.clear()
      }
      
    } catch (error) {
      console.warn('Failed to create worker, falling back to main thread:', error)
      this.worker = null
    }
  }

  async exportSlide(job: ExportJob): Promise<Blob> {
    if (!this.worker) {
      throw new Error('Worker not available, use main thread export')
    }

    return new Promise((resolve, reject) => {
      this.pendingJobs.set(job.id, { resolve, reject })
      this.worker!.postMessage({ job })
    })
  }

  async exportAndDownload(job: ExportJob, filename?: string): Promise<void> {
    const blob = await this.exportSlide(job)
    const finalFilename = filename || `drafter-${job.id}.png`
    downloadBlob(blob, finalFilename)
  }

  // Batch export multiple slides with parallel processing
  async exportBatch(jobs: ExportJob[], onProgress?: (completed: number, total: number) => void): Promise<Blob[]> {
    if (!this.worker) {
      throw new Error('Worker not available, use main thread export')
    }

    const results: Blob[] = new Array(jobs.length)
    let completed = 0
    
    // Process slides in parallel batches to avoid overwhelming the worker
    const BATCH_SIZE = 3 // Process 3 slides at a time
    const batches: ExportJob[][] = []
    
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      batches.push(jobs.slice(i, i + BATCH_SIZE))
    }
    
    console.log(`Processing ${jobs.length} slides in ${batches.length} batches of ${BATCH_SIZE}`)
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (job, batchIndex) => {
        const globalIndex = completed + batchIndex
        try {
          const blob = await this.exportSlide(job)
          results[globalIndex] = blob
          completed++
          onProgress?.(completed, jobs.length)
          return { index: globalIndex, success: true, blob }
        } catch (error) {
          console.error(`Failed to export slide ${globalIndex + 1}:`, error)
          results[globalIndex] = new Blob() // Empty blob for failed slides
          completed++
          onProgress?.(completed, jobs.length)
          return { index: globalIndex, success: false, error }
        }
      })
      
      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises)
      
      // Small delay between batches to prevent worker overload
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    console.log(`Batch export completed: ${results.filter(r => r.size > 0).length}/${jobs.length} successful`)
    return results
  }

  // Check if worker is supported
  static isSupported(): boolean {
    return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'
  }

  // Cleanup
  destroy() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    
    // Reject all pending jobs
    for (const [id, job] of this.pendingJobs) {
      job.reject(new Error('Worker destroyed'))
    }
    this.pendingJobs.clear()
  }
}

// Singleton instance
let workerManager: WorkerExportManager | null = null

export function getWorkerExportManager(): WorkerExportManager {
  if (!workerManager) {
    workerManager = new WorkerExportManager()
  }
  return workerManager
}

export function cleanupWorkerExport() {
  if (workerManager) {
    workerManager.destroy()
    workerManager = null
  }
}


