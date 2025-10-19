// src/lib/export/groupedZip.ts
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'
import type { Slide } from '@/types/slide'

// Note: This is a conceptual implementation
// You'll need to install JSZip: npm install jszip
// import JSZip from 'jszip'

export async function exportBySheet(groups: Record<string, Slide[]>) {
  // TODO: Implement with JSZip
  // This is pseudocode - integrate with your existing ZIP tool
  
  for (const [sheetName, slides] of Object.entries(groups)) {
    console.log(`Exporting sheet: ${sheetName} with ${slides.length} slides`)
    
    // Create ZIP for this sheet
    // const zip = new JSZip()
    
    for (const slide of slides) {
      try {
        const canvas = await renderSlideToCanvas({ slide, scale: 1 })
        const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png', 1))
        
        // Add to ZIP
        // zip.file(`${slide.id}.png`, blob)
        
        console.log(`Generated slide: ${slide.id}`)
      } catch (error) {
        console.error(`Failed to generate slide ${slide.id}:`, error)
      }
    }
    
    // Generate and download ZIP
    // const zipBlob = await zip.generateAsync({ type: 'blob' })
    // downloadAs(`${sheetName}.zip`, zipBlob)
  }
}

function downloadAs(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
