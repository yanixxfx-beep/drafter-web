// src/lib/grouping/groupSlides.ts
import type { SlidesBySheet, GroupsBySheet, DayResolver } from '@/types/sheets'
import type { Slide } from '@/types/slide'

export function groupSlidesBySheetAndDay(
  slidesBySheet: SlidesBySheet,
  opts: { getSheetName: (sheetId: string) => string; resolveDay: DayResolver }
): GroupsBySheet {
  const groups: GroupsBySheet = {}
  
  for (const [sheetId, slides] of Object.entries(slidesBySheet)) {
    const sheetName = opts.getSheetName(sheetId)
    const days: Record<string, Slide[]> = {}
    
    for (const slide of slides) {
      const dayKey = opts.resolveDay(slide)
      if (!days[dayKey]) {
        days[dayKey] = []
      }
      days[dayKey].push(slide)
    }
    
    // Optional sort: by natural day order, then by createdAt/seed/id
    for (const dayKey of Object.keys(days)) {
      days[dayKey].sort((a, b) => {
        // Sort by updatedAt if available, otherwise by id
        const timeA = (a as any).updatedAt || 0
        const timeB = (b as any).updatedAt || 0
        if (timeA !== timeB) {
          return timeA - timeB
        }
        return a.id.localeCompare(b.id)
      })
    }
    
    groups[sheetId] = { sheetId, sheetName, days }
  }
  
  return groups
}
