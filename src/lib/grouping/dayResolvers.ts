// src/lib/grouping/dayResolvers.ts
import type { DayResolver } from '@/types/sheets'
import type { Slide } from '@/types/slide'

// Preferred: we already store slide.meta.day during generation
export const bySlideMeta: DayResolver = (s) => s.meta?.day ?? 'Unassigned'

// Fallback: parse day/date from first text layer like "2025-10-21 - My idea" or "Mon: Title"
export const byTitlePrefix: DayResolver = (s) => {
  const t = s.textLayers?.[0]?.text || ''
  const m = /^\s*(\d{4}-\d{2}-\d{2}|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Day\s+\d+)\b/.exec(t)
  return m?.[1] ?? 'Unassigned'
}

// Fallback: stable bucket by index order when source has no day info
export const byIndexBucket = (bucketSize=5): DayResolver => {
  let i = 0
  const map = new WeakMap<object, number>()
  return (s) => {
    if (!map.has(s)) map.set(s, ++i)
    const n = map.get(s)!
    return `Batch ${Math.ceil(n / bucketSize)}`
  }
}

// Default resolver that tries multiple strategies
export const defaultDayResolver: DayResolver = (s) => {
  // Try meta first
  if (s.meta?.day) return s.meta.day
  
  // Try title prefix
  const titleDay = byTitlePrefix(s)
  if (titleDay !== 'Unassigned') return titleDay
  
  // Fallback to batch
  return byIndexBucket(5)(s)
}