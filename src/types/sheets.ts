export type SheetMeta = { 
  id: string
  name: string
  rowCount: number
}

export type SheetSelection = { 
  spreadsheetId: string
  sheets: SheetMeta[]
}

export type TextSettings = {
  font: string
  size: number
  lineHeight: number
  color: string
  title?: Partial<{
    size: number
    lineHeight: number
    color: string
    font: string
  }>
  subtitle?: Partial<{
    size: number
    lineHeight: number
    color: string
    font: string
  }>
  cta?: Partial<{
    size: number
    lineHeight: number
    color: string
    font: string
  }>
}

export type FormatSettings = { 
  width: number
  height: number
  templateId?: string
  watermark?: boolean
}

export type SheetConfig = { 
  sheetId: string
  sheetName: string
  text: TextSettings
  format: FormatSettings
}

export type RunConfig = {
  applyMode: 'all' | 'perSheet'
  sheets: SheetConfig[]
}
