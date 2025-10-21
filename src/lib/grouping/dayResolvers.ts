// src/lib/grouping/dayResolvers.ts
import type { DayResolver } from '@/types/sheets'

// 1) From a custom field you already carry on Slide (preferred)
export const bySlideMetaDate: DayResolver = (slide) => {
  return (slide as any).meta?.day ?? 'Unassigned'
}

// 2) From title text pattern "[Mon] ..." or "2025-10-17 ..."
export const byTitlePrefix: DayResolver = (slide) => {
  const text = slide.textLayers?.[0]?.text || ''
  const match = /^\s*(\d{4}-\d{2}-\d{2}|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/.exec(text)
  return match?.[1] ?? 'Unassigned'
}

// 3) From sourceSheet field (fallback)
export const bySourceSheet: DayResolver = (slide) => {
  return (slide as any).sourceSheet ?? 'Unassigned'
}

// 4) Default resolver that tries multiple methods
export const defaultDayResolver: DayResolver = (slide) => {
  // Try meta first
  const metaDay = (slide as any).meta?.day
  if (metaDay) return metaDay
  
  // Try title prefix
  const text = slide.textLayers?.[0]?.text || ''
  const titleMatch = /^\s*(\d{4}-\d{2}-\d{2}|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/.exec(text)
  if (titleMatch?.[1]) return titleMatch[1]
  
  // Fall back to sourceSheet
  return (slide as any).sourceSheet ?? 'Unassigned'
}
