import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase.server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Upload intent - Session:', session)
    console.log('Upload intent - User email:', session?.user?.email)
    
    if (!session?.user?.email) {
      console.log('Upload intent - No session or email found')
      return NextResponse.json({ error: 'Unauthorized - Please sign in first' }, { status: 401 })
    }

    const { workspaceId, kind, mime, bytes, filename } = await request.json()
    
    // Validate workspace ownership
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id, owner_id')
      .eq('id', workspaceId)
      .eq('owner_id', session.user.email)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 403 })
    }

    // Check quota
    const { data: quota } = await supabaseAdmin
      .from('quotas')
      .select('storage_bytes, storage_limit')
      .eq('user_id', session.user.email)
      .single()

    if (!quota) {
      // Create quota for new user
      await supabaseAdmin
        .from('quotas')
        .insert({ user_id: session.user.email, storage_bytes: 0, storage_limit: 10737418240 })
    }

    if (quota && quota.storage_bytes + bytes > quota.storage_limit) {
      return NextResponse.json({ error: 'Storage quota exceeded' }, { status: 413 })
    }

    // Generate storage key
    const fileId = crypto.randomUUID()
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const ext = filename.split('.').pop() || 'bin'
    
    const storageKey = `${session.user.email}/workspace/${workspaceId}/${kind}/${year}/${month}/${fileId}.${ext}`

    // Create signed upload URL
    const { data, error } = await supabaseAdmin.storage
      .from('user')
      .createSignedUploadUrl(storageKey, {
        upsert: false
      })

    if (error) {
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
    }

    return NextResponse.json({
      bucket: 'user',
      path: storageKey,
      token: data.token
    })

  } catch (error) {
    console.error('Upload intent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
