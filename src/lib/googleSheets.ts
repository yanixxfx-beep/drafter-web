import { google } from 'googleapis'

export interface GoogleSheet {
  id: string
  name: string
  url: string
}

export interface SheetData {
  sheetName: string
  headers: string[]
  rows: string[][]
}

// Initialize Google Sheets API
export const getGoogleSheetsClient = (accessToken: string) => {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  
  return google.sheets({ version: 'v4', auth })
}

// List all spreadsheets from Google Drive
export const listSpreadsheets = async (accessToken: string): Promise<GoogleSheet[]> => {
  try {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    
    const drive = google.drive({ version: 'v3', auth })
    
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'files(id, name, webViewLink)',
      pageSize: 100,
      orderBy: 'modifiedTime desc',
    })
    
    return (response.data.files || []).map(file => ({
      id: file.id!,
      name: file.name!,
      url: file.webViewLink!,
    }))
  } catch (error) {
    console.error('Error listing spreadsheets:', error)
    throw new Error('Failed to list Google Sheets')
  }
}

// Get sheet names from a specific spreadsheet
export const getSheetNames = async (accessToken: string, spreadsheetId: string): Promise<string[]> => {
  try {
    const sheets = getGoogleSheetsClient(accessToken)
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    })
    
    return (response.data.sheets || []).map(sheet => sheet.properties?.title || 'Untitled')
  } catch (error) {
    console.error('Error getting sheet names:', error)
    throw new Error('Failed to get sheet names')
  }
}

// Read data from a specific sheet
export const readSheetData = async (
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<SheetData> => {
  try {
    const sheets = getGoogleSheetsClient(accessToken)
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`, // Read all columns
    })
    
    const rows = response.data.values || []
    const headers = rows.length > 0 ? rows[0] : []
    const data = rows.slice(1)
    
    return {
      sheetName,
      headers,
      rows: data,
    }
  } catch (error) {
    console.error('Error reading sheet data:', error)
    throw new Error('Failed to read sheet data')
  }
}

// Detect slide columns (matching tokmatic_core2.py logic)
export const detectSlideColumns = (headers: string[]): string[] => {
  const ranked: Array<[number, string]> = []
  
  for (const col of headers) {
    const colLower = col.trim().toLowerCase()
    // Match patterns like "Slide 1", "slide1", "caption 2", etc.
    const match = colLower.match(/(slide|caption)[ _\-]*([0-9]{1,2})/)
    
    if (match) {
      ranked.push([parseInt(match[2]), col])
    } else if (['slide 1', 'slide1', 'caption', 'caption 1'].includes(colLower)) {
      ranked.push([1, col])
    }
  }
  
  if (ranked.length === 0) {
    // Fallback: any column containing 'caption' or 'slide'
    const texty = headers.filter(h => 
      h.toLowerCase().includes('caption') || h.toLowerCase().includes('slide')
    )
    return texty.length > 0 ? texty : headers
  }
  
  // Sort by number
  ranked.sort((a, b) => a[0] - b[0])
  return ranked.map(([_, col]) => col)
}

// Parse ideas from sheet data (matching your format)
export const parseIdeasFromSheet = (sheetData: SheetData) => {
  const slideColumns = detectSlideColumns(sheetData.headers)
  
  // Filter out rows where ALL slide columns are empty
  const validIdeas = sheetData.rows.filter(row => {
    return slideColumns.some((col, colIndex) => {
      const headerIndex = sheetData.headers.indexOf(col)
      const value = row[headerIndex]
      return value && value.trim() !== '' && value.toLowerCase() !== 'nan'
    })
  })
  
  const ideas = validIdeas.map((row, index) => {
    const idea: any = {
      id: index + 1,
    }
    
    sheetData.headers.forEach((header, colIndex) => {
      idea[header] = row[colIndex] || ''
    })
    
    return idea
  })
  
  return {
    ideas,
    slideColumns,
    totalIdeas: ideas.length,
  }
}

// Get random caption from ideas (matching tokmatic_core2.py)
export const getRandomCaption = (
  ideas: any[], 
  slideColumns: string[], 
  preferFirst: boolean = true
): string => {
  if (!ideas || ideas.length === 0) return ''
  
  const shuffled = [...ideas].sort(() => Math.random() - 0.5)
  
  if (preferFirst && slideColumns.length > 0) {
    const firstCol = slideColumns[0]
    for (const idea of shuffled) {
      const text = idea[firstCol]
      if (text && text.trim() && text.toLowerCase() !== 'nan') {
        return text.trim()
      }
    }
  }
  
  // Fallback: pick any non-empty slide text
  for (const idea of shuffled) {
    for (const col of slideColumns) {
      const text = idea[col]
      if (text && text.trim() && text.toLowerCase() !== 'nan') {
        return text.trim()
      }
    }
  }
  
  return ''
}
