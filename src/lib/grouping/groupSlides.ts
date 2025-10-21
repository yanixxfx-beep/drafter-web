// src/lib/grouping/groupSlides.ts
import type { SlidesBySheet, GroupsBySheet, DayResolver } from '@/types/sheets'
import type { Slide } from '@/types/slide'

const dayOrder = (a: string, b: string) => {
  // numeric date first; otherwise Mon..Sun; otherwise alpha
  const da = Date.parse(a); const db = Date.parse(b)
  if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db
  const wk = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const ia = wk.indexOf(a); const ib = wk.indexOf(b)
  if (ia>=0 && ib>=0) return ia - ib
  return a.localeCompare(b)
}

export function groupSlidesBySheetAndDay(
  slidesBySheet: SlidesBySheet,
  opts: { getSheetName: (sheetId: string) => string; resolveDay: DayResolver }
): GroupsBySheet {
  const groups: GroupsBySheet = {}
  for (const [sheetId, slides] of Object.entries(slidesBySheet)) {
    const sheetName = opts.getSheetName(sheetId)
    const days: Record<string, Slide[]> = {}
    for (const s of slides) {
      const k = opts.resolveDay(s)
      ;(days[k] ||= []).push(s)
    }
    // sort per day and overall day keys
    for (const k of Object.keys(days)) {
      days[k].sort((a,b)=> (a.updatedAt - b.updatedAt) || a.id.localeCompare(b.id))
    }
    const ordered: Record<string, Slide[]> = {}
    for (const k of Object.keys(days).sort(dayOrder)) ordered[k] = days[k]
    groups[sheetId] = { sheetId, sheetName, days: ordered }
  }
  return groups
}