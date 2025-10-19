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

    const { name } = await request.json()
    
    // Create workspace
    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .insert({
        owner_id: session.user.email,
        name: name || 'Default Workspace'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
    }

    return NextResponse.json(workspace)

  } catch (error) {
    console.error('Workspace creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
