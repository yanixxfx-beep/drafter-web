import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listSpreadsheets } from '@/lib/googleSheets'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    const spreadsheets = await listSpreadsheets(session.accessToken)
    
    return NextResponse.json({ spreadsheets })
  } catch (error) {
    console.error('Error in /api/sheets/list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spreadsheets' },
      { status: 500 }
    )
  }
}

