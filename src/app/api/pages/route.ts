import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase.from('staff').select('organization_id').eq('user_id', user.id).single()
  if (!staff) return NextResponse.json({ error: 'No staff' }, { status: 403 })

  // Get workspaces for this org
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('organization_id', staff.organization_id)

  const workspaceIds = workspaces?.map((w: { id: string }) => w.id) ?? []

  if (workspaceIds.length === 0) {
    return NextResponse.json([])
  }

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .in('workspace_id', workspaceIds)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase.from('staff').select('id, organization_id').eq('user_id', user.id).single()
  if (!staff) return NextResponse.json({ error: 'No staff' }, { status: 403 })

  // Get or create default workspace
  let { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('organization_id', staff.organization_id)
    .limit(1)
    .single()

  if (!workspace) {
    const { data: newWorkspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        organization_id: staff.organization_id,
        name: 'デフォルト',
      })
      .select()
      .single()

    if (wsError || !newWorkspace) return NextResponse.json({ error: wsError?.message ?? 'Failed to create workspace' }, { status: 500 })
    workspace = newWorkspace
  }

  const body = await request.json()
  const { data, error } = await supabase
    .from('pages')
    .insert({
      workspace_id: workspace!.id,
      parent_id: body.parent_id || null,
      title: body.title,
      content: body.content || null,
      is_public: body.is_public || false,
      created_by: staff.id,
      updated_by: staff.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
