import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getSheetNames, readSheetData, parseIdeasFromSheet } from '@/lib/googleSheets'

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
    
    // If no sheet name provided, get list of sheets
    if (!sheetName) {
      const sheetNames = await getSheetNames(session.accessToken, spreadsheetId)
      return NextResponse.json({ sheetNames })
    }
    
    // Read sheet data
    const sheetData = await readSheetData(session.accessToken, spreadsheetId, sheetName)
    const parsedData = parseIdeasFromSheet(sheetData)
    
    return NextResponse.json({
      ideas: parsedData.ideas,
      slideColumns: parsedData.slideColumns,
      totalIdeas: parsedData.totalIdeas,
      sheetName,
    })
  } catch (error) {
    console.error('Error in /api/sheets/read:', error)
    return NextResponse.json(
      { error: 'Failed to read sheet data' },
      { status: 500 }
    )
  }
}
