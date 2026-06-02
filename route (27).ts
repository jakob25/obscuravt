import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'

export async function GET(req: NextRequest) {
  const username = req.headers.get('x-username') ?? req.nextUrl.searchParams.get('username')
  // For now accept any request — auth is enforced on the client
  // TODO: add proper server-side session verification

  const { data, error } = await supabaseAdmin
    .from('vtubers')
    .select('id,name,handle,platform,link,bio,tags,nominated_by,created_at')
    .eq('approved', false)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch.' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session

  const { id, action } = await req.json()

  if (!id || !action)
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

  if (action === 'approve') {
    const { error } = await supabaseAdmin
      .from('vtubers')
      .update({ approved: true })
      .eq('id', id)

    if (error) return NextResponse.json({ error: 'Failed to approve.' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'reject') {
    const { error } = await supabaseAdmin
      .from('vtubers')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: 'Failed to reject.' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
