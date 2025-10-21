// src/lib/export/zipper.ts
import type { GroupsBySheet } from '@/types/sheets'
import type { Slide } from '@/types/slide'
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'

const sanitize = (s: string) => s.replace(/[^\w\-\s\.]/g, '_').trim().slice(0, 80)

async function slideBlob(s: Slide): Promise<Blob> {
  const canvas = await renderSlideToCanvas({ slide: s, scale: 1 })
  return new Promise(res => canvas.toBlob(b => res(b!), 'image/png', 1))
}

async function getZip() {
  const JSZip = (await import('jszip')).default
  return new JSZip()
}

function download(blob: Blob, filename: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(()=> URL.revokeObjectURL(a.href), 10_000)
}

export async function exportCombinedZip(groups: GroupsBySheet) {
  const zip = await getZip()
  for (const g of Object.values(groups)) {
    const sheetFolder = zip.folder(sanitize(g.sheetName))!
    for (const [dayKey, slides] of Object.entries(g.days)) {
      const dayFolder = sheetFolder.folder(sanitize(dayKey))!
      let i = 1
      for (const s of slides) {
        dayFolder.file(`${String(i++).padStart(3,'0')}_${sanitize(s.id)}.png`, await slideBlob(s))
      }
    }
  }
  download(await zip.generateAsync({ type: 'blob' }), 'Drafter_Export_All.zip')
}

export async function exportPerSheetZips(groups: GroupsBySheet) {
  for (const g of Object.values(groups)) {
    const zip = await getZip()
    for (const [dayKey, slides] of Object.entries(g.days)) {
      const dayFolder = zip.folder(sanitize(dayKey))!
      let i = 1
      for (const s of slides) {
        dayFolder.file(`${String(i++).padStart(3,'0')}_${sanitize(s.id)}.png`, await slideBlob(s))
      }
    }
    download(await zip.generateAsync({ type: 'blob' }), `${sanitize(g.sheetName)}.zip`)
  }
}

export async function exportScope(groups: GroupsBySheet, scope: { sheetId: string; day?: string }) {
  const g = groups[scope.sheetId]
  if (!g) return
  const zip = await getZip()
  if (scope.day) {
    const slides = g.days[scope.day] || []
    let i = 1
    for (const s of slides) zip.file(`${String(i++).padStart(3,'0')}_${sanitize(s.id)}.png`, await slideBlob(s))
    download(await zip.generateAsync({ type: 'blob' }), `${sanitize(g.sheetName)}_${sanitize(scope.day)}.zip`)
    return
  }
  for (const [dayKey, slides] of Object.entries(g.days)) {
    const dayFolder = zip.folder(sanitize(dayKey))!
    let i = 1
    for (const s of slides) dayFolder.file(`${String(i++).padStart(3,'0')}_${sanitize(s.id)}.png`, await slideBlob(s))
  }
  download(await zip.generateAsync({ type: 'blob' }), `${sanitize(g.sheetName)}.zip`)
}

export async function exportSelected(groups: GroupsBySheet, selected: Record<string, boolean>) {
  const zip = await getZip()
  for (const g of Object.values(groups)) {
    const sheetFolder = zip.folder(sanitize(g.sheetName))!
    for (const [dayKey, slides] of Object.entries(g.days)) {
      const dayFolder = sheetFolder.folder(sanitize(dayKey))!
      let i = 1
      for (const s of slides) {
        if (!selected[s.id]) continue
        dayFolder.file(`${String(i++).padStart(3,'0')}_${sanitize(s.id)}.png`, await slideBlob(s))
      }
    }
  }
  download(await zip.generateAsync({ type: 'blob' }), 'Drafter_Selected.zip')
}