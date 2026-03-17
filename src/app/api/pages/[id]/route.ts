import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getOrgWorkspaceIds(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: staff } = await supabase.from('staff').select('organization_id').eq('user_id', userId).single()
  if (!staff) return null
  const { data: workspaces } = await supabase.from('workspaces').select('id').eq('organization_id', staff.organization_id)
  return workspaces?.map((w: { id: string }) => w.id) ?? []
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceIds = await getOrgWorkspaceIds(supabase, user.id)
  if (!workspaceIds) return NextResponse.json({ error: 'No staff' }, { status: 403 })

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .in('workspace_id', workspaceIds.length > 0 ? workspaceIds : ['__none__'])
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceIds = await getOrgWorkspaceIds(supabase, user.id)
  if (!workspaceIds) return NextResponse.json({ error: 'No staff' }, { status: 403 })

  const { data: staff } = await supabase.from('staff').select('id').eq('user_id', user.id).single()

  const body = await request.json()
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updateData.title = body.title
  if (body.content !== undefined) updateData.content = body.content
  if (body.is_public !== undefined) updateData.is_public = body.is_public
  if (staff) updateData.updated_by = staff.id

  const { data, error } = await supabase
    .from('pages')
    .update(updateData)
    .eq('id', id)
    .in('workspace_id', workspaceIds.length > 0 ? workspaceIds : ['__none__'])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceIds = await getOrgWorkspaceIds(supabase, user.id)
  if (!workspaceIds) return NextResponse.json({ error: 'No staff' }, { status: 403 })

  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', id)
    .in('workspace_id', workspaceIds.length > 0 ? workspaceIds : ['__none__'])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
