import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase.server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workspaceId, storageKey, kind, mime, bytes, width, height, sha256 } = await request.json()
    
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

    // Insert media file record
    const { error: insertError } = await supabaseAdmin
      .from('media_files')
      .insert({
        owner_id: session.user.email,
        workspace_id: workspaceId,
        kind,
        bucket: 'user',
        storage_key: storageKey,
        mime,
        bytes,
        width,
        height,
        sha256
      })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 })
    }

    // Update quota - first get current quota, then update
    const { data: currentQuota } = await supabaseAdmin
      .from('quotas')
      .select('storage_bytes')
      .eq('user_id', session.user.email)
      .single()

    if (currentQuota) {
      const { error: quotaError } = await supabaseAdmin
        .from('quotas')
        .update({ storage_bytes: currentQuota.storage_bytes + bytes })
        .eq('user_id', session.user.email)

      if (quotaError) {
        console.error('Quota update error:', quotaError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Upload confirm error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
