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

    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const storageKey = searchParams.get('storageKey')
    const expiresIn = parseInt(searchParams.get('expiresIn') || '900')

    if (!bucket || !storageKey) {
      return NextResponse.json({ error: 'Missing bucket or storageKey' }, { status: 400 })
    }

    // Validate access to storageKey
    if (bucket === 'user') {
      const { data: mediaFile } = await supabaseAdmin
        .from('media_files')
        .select('id, owner_id')
        .eq('storage_key', storageKey)
        .eq('bucket', 'user')
        .single()

      if (!mediaFile || mediaFile.owner_id !== session.user.email) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (bucket === 'system') {
      // TODO: Add license check for system bucket
      return NextResponse.json({ error: 'System bucket access not implemented' }, { status: 501 })
    }

    // Create signed URL
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(storageKey, expiresIn)

    if (error) {
      return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })

  } catch (error) {
    console.error('Signed URL error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

