'use client'
import React from 'react'
import type { RunConfig } from '@/types/sheets'
import type { Slide } from '@/types/slide'
import { enqueueThumb } from '@/lib/images/thumbnail'
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'

export default function Step3MultiSheet({ 
  run, 
  slidesBySheet, 
  onReroll, 
  onEdit 
}: {
  run: RunConfig
  slidesBySheet: Record<string, Slide[]>
  onReroll: (sheetId: string, slideId: string) => void
  onEdit: (sheetId: string, slideId: string) => void
}) {
  React.useEffect(() => {
    // pre-render thumbs for all slides
    Object.values(slidesBySheet).flat().forEach(s => enqueueThumb(s))
  }, [slidesBySheet])

  const exportSheet = async (sheetId: string, filename: string) => {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    for (const s of (slidesBySheet[sheetId] || [])) {
      const canvas = await renderSlideToCanvas({ slide: s, scale: 1 })
      const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png', 1))
      zip.file(`${s.id}.png`, blob)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${filename}.zip`
    a.click()
  }

  return (
    <div className="flex gap-4">
      <aside className="w-64 border-r pr-4">
        <h4 className="font-semibold mb-2">Sheets</h4>
        <ul className="space-y-1">
          {run.sheets.map(s => (
            <li key={s.sheetId}>
              <button 
                className="w-full px-3 py-2 text-left rounded-lg hover:bg-gray-100 flex justify-between items-center" 
                onClick={() => document.getElementById(`sheet-${s.sheetId}`)?.scrollIntoView({behavior: 'smooth'})}
              >
                <span className="text-sm">{s.sheetName}</span>
                <span className="opacity-60">→</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex-1 space-y-8">
        {run.sheets.map(s => (
          <section key={s.sheetId} id={`sheet-${s.sheetId}`} className="scroll-mt-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{s.sheetName}</h3>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" 
                onClick={() => exportSheet(s.sheetId, s.sheetName)}
              >
                Export {s.sheetName}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {(slidesBySheet[s.sheetId] || []).map(slide => (
                <div key={slide.id} className="relative group">
                  <div className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden">
                    {slide.thumbUrl ? (
                      <img 
                        src={slide.thumbUrl} 
                        alt={slide.caption || 'Slide'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        Loading...
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button 
                      className="px-2 py-1 bg-white text-black rounded text-xs hover:bg-gray-100"
                      onClick={() => onReroll(s.sheetId, slide.id)}
                    >
                      Reroll
                    </button>
                    <button 
                      className="px-2 py-1 bg-white text-black rounded text-xs hover:bg-gray-100"
                      onClick={() => onEdit(s.sheetId, slide.id)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
