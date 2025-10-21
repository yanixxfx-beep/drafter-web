// src/types/sheets.ts
import type { Slide } from './slide'

export interface SheetMeta {
  id: string
  name: string
  rowCount: number
  columnCount: number
}

export interface SheetSelection {
  spreadsheetId: string
  spreadsheetName: string
  selectedSheets: string[]
}

export interface RunConfig {
  sheetSelections: SheetSelection[]
  globalSettings?: any
  perSheetSettings?: Record<string, any>
}

// New grouping types for Step 3 grouped display
export type DayKey = string // e.g. '2025-10-17' or 'Mon'
export type SheetKey = string // sheetId

export type SlideGroup = {
  sheetId: SheetKey
  sheetName: string
  days: Record<DayKey, Slide[]>
}

export type SlidesBySheet = Record<SheetKey, Slide[]>
export type GroupsBySheet = Record<SheetKey, SlideGroup>

export type DayResolver = (slide: Slide) => DayKey