import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'

export async function POST() {
  try {
    // Test if we can connect to Supabase
    const { data, error } = await supabaseAdmin
      .from('quotas')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({
        error: 'Database connection failed',
        details: error.message,
        suggestion: 'Please run the SQL schema in your Supabase SQL Editor'
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Database connection successful',
      tablesExist: true
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Database setup check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Please check your Supabase configuration and run the SQL schema'
    }, { status: 500 })
  }
}
