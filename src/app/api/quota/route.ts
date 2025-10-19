import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase.server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: quota } = await supabaseAdmin
      .from('quotas')
      .select('storage_bytes, storage_limit, plan')
      .eq('user_id', session.user.email)
      .single()

    if (!quota) {
      // Create default quota for new user
      const { data: newQuota } = await supabaseAdmin
        .from('quotas')
        .insert({
          user_id: session.user.email,
          storage_bytes: 0,
          storage_limit: 10737418240, // 10 GB
          plan: 'free'
        })
        .select()
        .single()

      return NextResponse.json(newQuota)
    }

    return NextResponse.json(quota)

  } catch (error) {
    console.error('Quota fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
