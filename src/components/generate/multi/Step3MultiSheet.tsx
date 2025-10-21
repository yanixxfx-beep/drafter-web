// src/components/generate/multi/Step3MultiSheet.tsx
'use client'
import React, { useState } from 'react'
import type { RunConfig, GroupsBySheet, SlidesBySheet } from '@/types/sheets'
import type { Slide } from '@/types/slide'
import { groupSlidesBySheetAndDay } from '@/lib/grouping/groupSlides'
import { enqueueThumb } from '@/lib/images/thumbnail'
import { exportCombinedZip, exportPerSheetZips, exportScope } from '@/lib/export/zipper'
import { useTheme } from '@/context/ThemeContext'

interface Step3MultiSheetProps {
  run: RunConfig
  slidesBySheet: SlidesBySheet
  getSheetName: (sheetId: string) => string
  resolveDay: (slide: Slide) => string
  onReroll: (sheetId: string, slideId: string) => void
  onEdit: (sheetId: string, slideId: string) => void
}

export default function Step3MultiSheet({
  run,
  slidesBySheet,
  getSheetName,
  resolveDay,
  onReroll,
  onEdit
}: Step3MultiSheetProps) {
  const { colors } = useTheme()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState({ done: 0, total: 0 })
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const groups = React.useMemo<GroupsBySheet>(() => (
    groupSlidesBySheetAndDay(slidesBySheet, { getSheetName, resolveDay })
  ), [slidesBySheet, getSheetName, resolveDay])

  // Pre-render thumbs once grouped
  React.useEffect(() => {
    Object.values(groups).forEach(group => 
      Object.values(group.days).flat().forEach(slide => enqueueThumb(slide))
    )
  }, [groups])

  const toggle = (slide: Slide) => setSelected(prev => ({ ...prev, [slide.id]: !prev[slide.id] }))
  const isSelected = (slide: Slide) => !!selected[slide.id]

  // Export handlers
  const handleExportAllCombined = async () => {
    setIsExporting(true)
    try {
      await exportCombinedZip(groups)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPerSheet = async () => {
    setIsExporting(true)
    try {
      await exportPerSheetZips(groups)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCurrent = async (sheetId: string, day?: string) => {
    setIsExporting(true)
    try {
      await exportScope(groups, { sheetId, day })
    } finally {
      setIsExporting(false)
    }
  }

  const scrollToSheet = (sheetId: string) => {
    const element = document.getElementById(`sheet-${sheetId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex gap-6 min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r pr-4 space-y-4" style={{ borderColor: colors.border }}>
        <h4 className="font-semibold text-lg" style={{ color: colors.text }}>
          Sheets
        </h4>
        
        <ul className="space-y-2">
          {Object.values(groups).map(group => (
            <li key={group.sheetId}>
              <button 
                className="w-full text-left p-3 rounded-lg border transition-all hover:bg-opacity-50"
                style={{ 
                  backgroundColor: colors.surface2, 
                  borderColor: colors.border,
                  color: colors.text
                }}
                onClick={() => scrollToSheet(group.sheetId)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{group.sheetName}</span>
                  <span className="text-sm opacity-60">→</span>
                </div>
                <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  {Object.values(group.days).flat().length} slides
                </div>
              </button>
            </li>
          ))}
        </ul>

        <div className="border-t pt-4" style={{ borderColor: colors.border }}>
          <button 
            className="w-full p-3 rounded-lg font-medium transition-all disabled:opacity-50"
            style={{ 
              backgroundColor: colors.accent, 
              color: 'white' 
            }}
            onClick={handleExportAllCombined}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export ALL (combined ZIP)'}
          </button>
          
          <button 
            className="w-full p-3 rounded-lg border mt-2 transition-all disabled:opacity-50"
            style={{ 
              backgroundColor: colors.surface2, 
              borderColor: colors.border,
              color: colors.text
            }}
            onClick={handleExportPerSheet}
            disabled={isExporting}
          >
            Export per sheet (multiple ZIPs)
          </button>
        </div>

        {isExporting && (
          <div className="text-sm" style={{ color: colors.textMuted }}>
            Progress: {exportProgress.done} / {exportProgress.total}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-8">
        {Object.values(groups).map(group => (
          <section 
            key={group.sheetId} 
            id={`sheet-${group.sheetId}`} 
            className="scroll-mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold" style={{ color: colors.text }}>
                {group.sheetName}
              </h3>
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 rounded-lg border transition-all"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  onClick={() => handleExportCurrent(group.sheetId)}
                  disabled={isExporting}
                >
                  Export sheet
                </button>
              </div>
            </div>

            {Object.entries(group.days).map(([dayKey, slides]) => (
              <article key={dayKey} className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium" style={{ color: colors.text }}>
                    {dayKey}
                  </h4>
                  <div className="flex gap-2">
                    <button 
                      className="px-3 py-1 rounded border text-sm transition-all"
                      style={{ 
                        backgroundColor: colors.surface2, 
                        borderColor: colors.border,
                        color: colors.text
                      }}
                      onClick={() => handleExportCurrent(group.sheetId, dayKey)}
                      disabled={isExporting}
                    >
                      Export day
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {slides.map(slide => (
                    <figure 
                      key={slide.id} 
                      className={`border rounded-lg p-3 transition-all ${
                        isSelected(slide) ? 'ring-2 ring-opacity-50' : ''
                      }`}
                      style={{ 
                        backgroundColor: colors.surface,
                        borderColor: isSelected(slide) ? colors.accent : colors.border
                      }}
                    >
                      <img 
                        src={slide.thumbUrl ?? ''} 
                        alt="thumbnail" 
                        className="w-full aspect-[9/16] object-cover rounded"
                      />
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={isSelected(slide)} 
                            onChange={() => toggle(slide)}
                            className="rounded"
                          />
                          <span className="text-xs" style={{ color: colors.textMuted }}>
                            {slide.id}
                          </span>
                        </div>
                        
                        <div className="flex gap-1">
                          <button 
                            className="px-2 py-1 rounded text-xs transition-all"
                            style={{ 
                              backgroundColor: colors.surface2, 
                              color: colors.text
                            }}
                            onClick={() => onReroll(group.sheetId, slide.id)}
                            disabled={isExporting}
                          >
                            Re-roll
                          </button>
                          <button 
                            className="px-2 py-1 rounded text-xs transition-all"
                            style={{ 
                              backgroundColor: colors.accent, 
                              color: 'white'
                            }}
                            onClick={() => onEdit(group.sheetId, slide.id)}
                            disabled={isExporting}
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