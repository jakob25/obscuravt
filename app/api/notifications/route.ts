import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireAuth } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { supabaseAdmin } = await import('@/lib/supabase')
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'username is required.' }, { status: 400 })
  }

  const session = await getSession(req)
  if (!session || session.username !== username) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('id,username,title,message,type,related_id,is_read,created_at')
    .eq('username', username)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { supabaseAdmin } = await import('@/lib/supabase')
  const body = await req.json()
  const { id, mark_all } = body

  if (mark_all) {
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('username', session.username)
      .eq('is_read', false)
    return NextResponse.json({ ok: true })
  }

  if (!id) {
    return NextResponse.json({ error: 'id or mark_all is required.' }, { status: 400 })
  }

  const { data: note } = await supabaseAdmin
    .from('notifications')
    .select('username')
    .eq('id', id)
    .single()

  if (!note || note.username !== session.username) {
    return NextResponse.json({ error: 'Notification not found.' }, { status: 404 })
  }

  await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', id)
  return NextResponse.json({ ok: true })
}