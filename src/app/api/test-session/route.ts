import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('Test session API called')
    const session = await getServerSession(authOptions)
    
    console.log('Session details:', {
      hasSession: !!session,
      user: session?.user,
      accessToken: session?.accessToken ? 'Present' : 'Missing',
      refreshToken: session?.refreshToken ? 'Present' : 'Missing'
    })
    
    return NextResponse.json({
      hasSession: !!session,
      user: session?.user,
      hasAccessToken: !!session?.accessToken,
      hasRefreshToken: !!session?.refreshToken
    })
  } catch (error) {
    console.error('Error in test-session:', error)
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    )
  }
}

