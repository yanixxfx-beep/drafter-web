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
import { useGenerateStore } from '@/store/generateStore'
import SheetsSidebar from '@/components/generate/common/SheetsSidebar'
import DaySection from '@/components/generate/common/DaySection'

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
  const { selected, toggleSelect } = useGenerateStore()
  
  const groups = React.useMemo<GroupsBySheet>(() => (
    groupSlidesBySheetAndDay(slidesBySheet, { getSheetName, resolveDay })
  ), [slidesBySheet, getSheetName, resolveDay])

  // thumbs
  React.useEffect(() => {
    Object.values(groups).forEach(g => Object.values(g.days).flat().forEach(enqueueThumb))
  }, [groups])

  // export handlers
  const exportAll = () => exportCombinedZip(groups)
  const exportPerSheet = () => exportPerSheetZips(groups)
  const exportDay = (sheetId: string, day: string) => exportScope(groups, { sheetId, day })
  const exportSheet = (sheetId: string) => exportScope(groups, { sheetId })
  const exportOnlySelected = () => exportSelected(groups, selected)
  const hasSelected = Object.values(selected).some(Boolean)

  const handleSheetClick = (sheetId: string) => {
    document.getElementById(`sheet-${sheetId}`)?.scrollIntoView({behavior:'smooth'})
  }

  return (
    <div className="flex gap-4">
      <SheetsSidebar
        groups={groups}
        onSheetClick={handleSheetClick}
        onExportAll={exportAll}
        onExportPerSheet={exportPerSheet}
        onExportSelected={exportOnlySelected}
        hasSelected={hasSelected}
      />

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
              <DaySection
                key={dayKey}
                dayKey={dayKey}
                slides={slides}
                onExportDay={() => exportDay(g.sheetId, dayKey)}
                onReroll={(slideId) => onReroll(g.sheetId, slideId)}
                onEdit={(slideId) => onEdit(g.sheetId, slideId)}
                onToggleSelect={toggleSelect}
                selectedSlides={selected}
              />
            ))}
          </section>
        ))}
      </main>
    </div>
  )
}