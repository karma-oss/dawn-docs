import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function verifyPageAccess(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, pageId: string) {
  const { data: staff } = await supabase.from('staff').select('id, organization_id').eq('user_id', userId).single()
  if (!staff) return null
  const { data: workspaces } = await supabase.from('workspaces').select('id').eq('organization_id', staff.organization_id)
  const workspaceIds = workspaces?.map((w: { id: string }) => w.id) ?? []
  if (workspaceIds.length === 0) return null
  const { data: page } = await supabase.from('pages').select('id').eq('id', pageId).in('workspace_id', workspaceIds).single()
  if (!page) return null
  return staff
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await verifyPageAccess(supabase, user.id, id)
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('page_versions')
    .select('*')
    .eq('page_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await verifyPageAccess(supabase, user.id, id)
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('page_versions')
    .insert({
      page_id: id,
      content: body.content,
      created_by: staff.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
