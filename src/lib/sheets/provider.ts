import { api } from '@/lib/fetcher'
import type { SheetMeta } from '@/types/sheets'

export async function listSheetsForSpreadsheet(spreadsheetId: string): Promise<SheetMeta[]> {
  return api(`/api/sheets/list?spreadsheetId=${encodeURIComponent(spreadsheetId)}`)
}
