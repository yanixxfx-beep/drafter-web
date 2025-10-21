// src/lib/export/zipper.ts
import JSZip from 'jszip'
import type { GroupsBySheet } from '@/types/sheets'
import type { Slide } from '@/types/slide'
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'

const sanitize = (s: string) => s.replace(/[^\w\-\s\.]/g, '_').trim().slice(0, 80)

async function slideBlob(slide: Slide): Promise<Blob> {
  const canvas = await renderSlideToCanvas({ slide, scale: 1 })
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/png', 1))
}

export async function exportCombinedZip(groups: GroupsBySheet) {
  const zip = new JSZip()
  
  for (const group of Object.values(groups)) {
    const sheetFolder = zip.folder(sanitize(group.sheetName))!
    
    for (const [dayKey, slides] of Object.entries(group.days)) {
      const dayFolder = sheetFolder.folder(sanitize(dayKey))!
      let i = 1
      
      for (const slide of slides) {
        const blob = await slideBlob(slide)
        dayFolder.file(`${String(i).padStart(3, '0')}_${sanitize(slide.id)}.png`, blob)
        i++
      }
    }
  }
  
  const blob = await zip.generateAsync({ type: 'blob' })
  download(blob, 'Drafter_Export_All.zip')
}

export async function exportPerSheetZips(groups: GroupsBySheet) {
  for (const group of Object.values(groups)) {
    const zip = new JSZip()
    
    for (const [dayKey, slides] of Object.entries(group.days)) {
      const dayFolder = zip.folder(sanitize(dayKey))!
      let i = 1
      
      for (const slide of slides) {
        const blob = await slideBlob(slide)
        dayFolder.file(`${String(i).padStart(3, '0')}_${sanitize(slide.id)}.png`, blob)
        i++
      }
    }
    
    const blob = await zip.generateAsync({ type: 'blob' })
    download(blob, `${sanitize(group.sheetName)}.zip`)
  }
}

export async function exportScope(groups: GroupsBySheet, scope: { sheetId: string; day?: string }) {
  const group = groups[scope.sheetId]
  if (!group) return
  
  const zip = new JSZip()
  
  if (scope.day) {
    // Export specific day
    const slides = group.days[scope.day] || []
    let i = 1
    
    for (const slide of slides) {
      const blob = await slideBlob(slide)
      zip.file(`${String(i).padStart(3, '0')}_${sanitize(slide.id)}.png`, blob)
      i++
    }
    
    const blob = await zip.generateAsync({ type: 'blob' })
    download(blob, `${sanitize(group.sheetName)}_${sanitize(scope.day)}.zip`)
    return
  }
  
  // Export whole sheet
  for (const [dayKey, slides] of Object.entries(group.days)) {
    const dayFolder = zip.folder(sanitize(dayKey))!
    let i = 1
    
    for (const slide of slides) {
      const blob = await slideBlob(slide)
      dayFolder.file(`${String(i).padStart(3, '0')}_${sanitize(slide.id)}.png`, blob)
      i++
    }
  }
  
  const blob = await zip.generateAsync({ type: 'blob' })
  download(blob, `${sanitize(group.sheetName)}.zip`)
}

// Export with progress callback
export async function exportCombinedZipWithProgress(
  groups: GroupsBySheet, 
  onProgress: (done: number, total: number) => void
) {
  const allSlides = Object.values(groups).flatMap(group => 
    Object.values(group.days).flat()
  )
  
  const zip = new JSZip()
  let processed = 0
  
  for (const group of Object.values(groups)) {
    const sheetFolder = zip.folder(sanitize(group.sheetName))!
    
    for (const [dayKey, slides] of Object.entries(group.days)) {
      const dayFolder = sheetFolder.folder(sanitize(dayKey))!
      let i = 1
      
      for (const slide of slides) {
        const blob = await slideBlob(slide)
        dayFolder.file(`${String(i).padStart(3, '0')}_${sanitize(slide.id)}.png`, blob)
        i++
        processed++
        onProgress(processed, allSlides.length)
      }
    }
  }
  
  const blob = await zip.generateAsync({ type: 'blob' })
  download(blob, 'Drafter_Export_All.zip')
}

function download(blob: Blob, filename: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
}
