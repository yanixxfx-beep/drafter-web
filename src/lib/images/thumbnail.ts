// src/lib/images/thumbnail.ts
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'
import type { Slide } from '@/types/slide'

const MAX_CONCURRENCY = 3
let inFlight = 0
const q: Array<() => Promise<void>> = []

function pump() {
  if (inFlight >= MAX_CONCURRENCY) return
  const job = q.shift()
  if (!job) return
  inFlight++
  job().finally(() => {
    inFlight--
    pump()
  })
}

export function enqueueThumb(slide: Slide, targetWidth = 216) {
  q.push(async () => {
    const scale = targetWidth / slide.exportSize.w
    const canvas = await renderSlideToCanvas({ slide, scale })
    const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png', 0.92))
    const url = URL.createObjectURL(blob)
    if (slide.thumbUrl) URL.revokeObjectURL(slide.thumbUrl)
    slide.thumbUrl = url
    slide._rev = (slide._rev || 0) + 1
  })
  pump()
}

export function cleanupThumbnails(slides: Slide[]) {
  slides.forEach(slide => {
    if (slide.thumbUrl) {
      URL.revokeObjectURL(slide.thumbUrl)
      slide.thumbUrl = undefined
    }
  })
}