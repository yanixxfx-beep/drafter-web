import type { RenderOpts } from '@/lib/render/SlideRenderer'
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'

export type ThumbnailJob = {
  id: string
  opts: RenderOpts
  onComplete?: (blobUrl: string) => void
  onError?: (error: unknown) => void
}

const queue: ThumbnailJob[] = []
let running = false

export function enqueueThumbnail(job: ThumbnailJob) {
  queue.push(job)
  if (!running) {
    void runQueue()
  }
}

export function clearThumbnails(predicate?: (job: ThumbnailJob) => boolean) {
  if (!predicate) {
    queue.length = 0
    return
  }

  let i = queue.length
  while (i--) {
    if (predicate(queue[i])) {
      queue.splice(i, 1)
    }
  }
}

async function runQueue() {
  running = true
  while (queue.length > 0) {
    const job = queue.shift()
    if (!job) continue
    try {
      const canvas = await renderSlideToCanvas(job.opts)
      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.92))
      if (!blob) {
        throw new Error('thumbnail: canvas.toBlob returned null')
      }
      const url = URL.createObjectURL(blob)
      job.onComplete?.(url)
    } catch (error) {
      console.error('thumbnail queue error', error)
      job.onError?.(error)
    }
    await delay(16)
  }
  running = false
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
