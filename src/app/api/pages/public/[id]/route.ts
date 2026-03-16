import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pages')
    .select('id, title, content, updated_at')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Page not found or not public' }, { status: 404 })
  }

  return NextResponse.json(data)
}
