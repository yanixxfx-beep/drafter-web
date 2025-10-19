import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readSheetData, detectSlideColumns } from '@/lib/googleSheets'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    const { spreadsheetId, sheetName } = await request.json()
    
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Spreadsheet ID required' },
        { status: 400 }
      )
    }
    
    // Read sheet data (first 5 rows for preview)
    const sheetData = await readSheetData(session.accessToken, spreadsheetId, sheetName || 'Sheet1')
    
    // Detect slide columns
    const slideColumns = detectSlideColumns(sheetData.headers)
    
    // Return preview data (first 3 rows)
    const previewData = {
      headers: sheetData.headers,
      sampleRows: sheetData.rows.slice(0, 3),
      slideColumns,
      totalRows: sheetData.rows.length
    }
    
    return NextResponse.json(previewData)
  } catch (error) {
    console.error('Error in /api/sheets/preview:', error)
    return NextResponse.json(
      { error: 'Failed to preview sheet data' },
      { status: 500 }
    )
  }
}
