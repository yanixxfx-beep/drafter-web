// src/components/generate/multi/Step3MultiSheet.tsx
'use client'
import React from 'react'
import type { RunConfig, GroupsBySheet } from '@/types/sheets'
import type { Slide } from '@/types/slide'
import { groupSlidesBySheetAndDay } from '@/lib/grouping/groupSlides'
import { bySlideMeta } from '@/lib/grouping/dayResolvers'
import { enqueueThumb } from '@/lib/images/thumbnail'
import { exportCombinedZip, exportPerSheetZips, exportScope, exportSelected } from '@/lib/export/zipper'
import { useTheme } from '@/context/ThemeContext'

export default function Step3MultiSheet({
  run,
  slidesBySheet,
  getSheetName,
  resolveDay = bySlideMeta,
  onReroll,
  onEdit
}: {
  run: RunConfig
  slidesBySheet: Record<string, Slide[]>
  getSheetName: (sheetId: string) => string
  resolveDay?: (slide: Slide) => string
  onReroll: (sheetId: string, slideId: string) => void
  onEdit: (sheetId: string, slideId: string) => void
}) {
  const { colors } = useTheme()
  
  const groups = React.useMemo<GroupsBySheet>(() => (
    groupSlidesBySheetAndDay(slidesBySheet, { getSheetName, resolveDay })
  ), [slidesBySheet, getSheetName, resolveDay])

  // thumbs
  React.useEffect(() => {
    Object.values(groups).forEach(g => Object.values(g.days).flat().forEach(enqueueThumb))
  }, [groups])

  // selection
  const [sel, setSel] = React.useState<Record<string, boolean>>({})
  const toggle = (s: Slide) => setSel(v=>({ ...v, [s.id]: !v[s.id] }))
  const isSel = (s: Slide) => !!sel[s.id]

  // export handlers
  const exportAll = () => exportCombinedZip(groups)
  const exportPerSheet = () => exportPerSheetZips(groups)
  const exportDay = (sheetId: string, day: string) => exportScope(groups, { sheetId, day })
  const exportSheet = (sheetId: string) => exportScope(groups, { sheetId })
  const exportOnlySelected = () => exportSelected(groups, sel)

  return (
    <div className="flex gap-4">
      <aside className="w-68 border-r pr-4 space-y-3" style={{ borderColor: colors.border }}>
        <h4 className="font-semibold" style={{ color: colors.text }}>Sheets</h4>
        <ul className="space-y-1">
          {Object.values(groups).map(g => (
            <li key={g.sheetId}>
              <button 
                className="w-full justify-between p-2 rounded hover:bg-opacity-10 transition-colors"
                style={{ 
                  backgroundColor: 'transparent',
                  color: colors.text,
                  border: `1px solid ${colors.border}`
                }}
                onClick={()=>document.getElementById(`sheet-${g.sheetId}`)?.scrollIntoView({behavior:'smooth'})}
              >
                <span>{g.sheetName}</span><span className="opacity-60">→</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="divider" style={{ borderColor: colors.border }}/>
        <button 
          className="w-full p-2 rounded font-medium"
          style={{ 
            backgroundColor: colors.accent, 
            color: 'white',
            border: 'none'
          }}
          onClick={exportAll}
        >
          Export ALL (combined ZIP)
        </button>
        <button 
          className="w-full p-2 rounded font-medium"
          style={{ 
            backgroundColor: colors.surface2, 
            color: colors.text,
            border: `1px solid ${colors.border}`
          }}
          onClick={exportPerSheet}
        >
          Export per sheet (multiple ZIPs)
        </button>
        <button 
          className="w-full p-2 rounded font-medium disabled:opacity-50"
          style={{ 
            backgroundColor: colors.surface2, 
            color: colors.text,
            border: `1px solid ${colors.border}`
          }}
          onClick={exportOnlySelected} 
          disabled={!Object.values(sel).some(Boolean)}
        >
          Export SELECTED
        </button>
      </aside>

      <main className="flex-1 space-y-10">
        {Object.values(groups).map(g => (
          <section key={g.sheetId} id={`sheet-${g.sheetId}`} className="scroll-mt-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>{g.sheetName}</h3>
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1 rounded text-sm"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    color: colors.text,
                    border: `1px solid ${colors.border}`
                  }}
                  onClick={()=>exportSheet(g.sheetId)}
                >
                  Export sheet
                </button>
              </div>
            </div>

            {Object.entries(g.days).map(([dayKey, slides]) => (
              <article key={dayKey} className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium opacity-80" style={{ color: colors.text }}>{dayKey}</h4>
                  <div className="flex gap-2">
                    <button 
                      className="px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: colors.surface2, 
                        color: colors.text,
                        border: `1px solid ${colors.border}`
                      }}
                      onClick={()=>exportDay(g.sheetId, dayKey)}
                    >
                      Export day
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {slides.map(s => (
                    <figure 
                      key={s.id} 
                      className={`border rounded p-2 ${isSel(s)?'ring-2 ring-primary':''}`}
                      style={{ 
                        borderColor: isSel(s) ? colors.accent : colors.border,
                        backgroundColor: colors.surface2
                      }}
                    >
                      <img 
                        src={s.thumbUrl ?? ''} 
                        alt="thumb" 
                        className="w-full aspect-[9/16] object-cover rounded"
                      />
                      <div className="flex justify-between mt-2">
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input 
                            type="checkbox" 
                            checked={isSel(s)} 
                            onChange={()=>toggle(s)}
                            style={{ accentColor: colors.accent }}
                          /> 
                          Select
                        </label>
                        <div className="flex gap-2">
                          <button 
                            className="px-2 py-1 rounded text-xs"
                            style={{ 
                              backgroundColor: colors.surface, 
                              color: colors.text,
                              border: `1px solid ${colors.border}`
                            }}
                            onClick={()=>onReroll(g.sheetId, s.id)}
                          >
                            Re‑roll
                          </button>
                          <button 
                            className="px-2 py-1 rounded text-xs"
                            style={{ 
                              backgroundColor: colors.surface, 
                              color: colors.text,
                              border: `1px solid ${colors.border}`
                            }}
                            onClick={()=>onEdit(g.sheetId, s.id)}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </figure>
                  ))}
                </div>
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  )
}