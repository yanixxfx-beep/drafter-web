// src/types/sheets.ts
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