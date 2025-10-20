// src/lib/sheets/provider.ts
import { api } from '@/lib/fetcher'

export interface SheetMeta {
  id: string
  name: string
  rowCount: number
  columnCount: number
}

export async function listSheetsForSpreadsheet(spreadsheetId: string): Promise<SheetMeta[]> {
  return api(`/api/sheets/list?spreadsheetId=${encodeURIComponent(spreadsheetId)}`)
}

export async function readSheetData(spreadsheetId: string, sheetName: string) {
  return api(`/api/sheets/read?spreadsheetId=${encodeURIComponent(spreadsheetId)}&sheetName=${encodeURIComponent(sheetName)}`)
}