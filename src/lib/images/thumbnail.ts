import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'
import type { Slide } from '@/types/slide'

const MAX_CONCURRENCY = 3
let inFlight = 0
const q: Array<() => Promise<void>> = []
const lowPriorityQ: Array<() => Promise<void>> = []

function pump() {
  if (inFlight >= MAX_CONCURRENCY) return
  const job = q.shift() || lowPriorityQ.shift()
  if (!job) return
  inFlight++
  job().finally(() => { 
    inFlight--
    pump() 
  })
}

// Use requestIdleCallback for low priority thumbnails
function scheduleLowPriority(job: () => Promise<void>) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      lowPriorityQ.push(job)
      pump()
    })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      lowPriorityQ.push(job)
      pump()
    }, 0)
  }
}

export function enqueueThumb(slide: Slide, targetWidth = 216, priority: 'high' | 'low' = 'low') {
  const job = async () => {
    try {
      const scale = targetWidth / slide.exportSize.w
      const canvas = await renderSlideToCanvas({ slide, scale })
      const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png', 0.92))
      const url = URL.createObjectURL(blob)
      
      // Clean up old URL
      if (slide.thumbUrl) {
        URL.revokeObjectURL(slide.thumbUrl)
      }
      
      // Update slide
      slide.thumbUrl = url
      slide._rev = (slide._rev || 0) + 1
      slide.lastModified = Date.now()
    } catch (error) {
      console.error('Error generating thumbnail:', error)
    }
  }

  if (priority === 'high') {
    q.push(job)
    pump()
  } else {
    scheduleLowPriority(job)
  }
}

// Cleanup function for when slides are removed
export function cleanupThumb(slide: Slide) {
  if (slide.thumbUrl) {
    URL.revokeObjectURL(slide.thumbUrl)
    slide.thumbUrl = null
  }
}

// Cleanup all thumbnails for a set of slides
export function cleanupAllThumbs(slides: Slide[]) {
  slides.forEach(cleanupThumb)
}

// Get queue status for debugging
export function getQueueStatus() {
  return {
    queueLength: q.length,
    inFlight: inFlight,
    maxConcurrency: MAX_CONCURRENCY
  }
}