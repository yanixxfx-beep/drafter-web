import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listSpreadsheets } from '@/lib/googleSheets'

export async function GET(request: NextRequest) {
  try {
    console.log('Sheets list API called')
    const session = await getServerSession(authOptions)
    
    console.log('Session in API:', { 
      hasSession: !!session, 
      hasAccessToken: !!session?.accessToken,
      user: session?.user?.email 
    })
    
    if (!session || !session.accessToken) {
      console.log('No session or access token')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    console.log('Fetching spreadsheets...')
    const spreadsheets = await listSpreadsheets(session.accessToken)
    console.log(`Found ${spreadsheets.length} spreadsheets`)
    
    return NextResponse.json({ spreadsheets })
  } catch (error) {
    console.error('Error in /api/sheets/list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spreadsheets' },
      { status: 500 }
    )
  }
}

