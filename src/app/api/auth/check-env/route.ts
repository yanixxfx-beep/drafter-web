import { NextResponse } from 'next/server'

export async function GET() {
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET', 
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length > 0) {
    return NextResponse.json({
      error: 'Missing environment variables',
      missing,
      message: 'Please check your .env.local file'
    }, { status: 400 })
  }

  return NextResponse.json({
    message: 'All required environment variables are present',
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL
  })
}

