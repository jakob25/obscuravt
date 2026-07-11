import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'

async function getOwnedVtuberForSession(username: string) {
  const { supabaseAdmin } = await import('@/lib/supabase')

  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('active_vtuber_id')
    .eq('username', username)
    .single()

  if (userRow?.active_vtuber_id) {
    const { data: activeVtuber } = await supabaseAdmin
      .from('vtubers')
      .select('id')
      .eq('id', userRow.active_vtuber_id)
      .eq('claimed_by', username)
      .single()

    if (activeVtuber) return activeVtuber
  }

  const { data: claimedVtubers } = await supabaseAdmin
    .from('vtubers')
    .select('id')
    .eq('claimed_by', username)
    .limit(1)

  return claimedVtubers?.[0] ?? null
}

export async function GET(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { supabaseAdmin } = await import('@/lib/supabase')
  const vtuber = await getOwnedVtuberForSession(session.username)
  if (!vtuber) return NextResponse.json([])

  const now = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('collab_notifications')
    .select(`
      id,
      created_at,
      cleared,
      collab_requests!inner (
        id,
        request_type,
        game_or_activity,
        on_stream,
        availability,
        contact_twitter,
        contact_discord,
        expires_at
      ),
      vtubers!collab_notifications_recipient_fkey (id, name, avatar_url)
    `)
    .eq('recipient', vtuber.id)
    .eq('cleared', false)
    .gt('collab_requests.expires_at', now)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((data ?? []).map((row: any) => ({
    id: row.id,
    created_at: row.created_at,
    cleared: row.cleared,
    request: row.collab_requests,
    requester: row.vtubers,
  })))
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { supabaseAdmin } = await import('@/lib/supabase')
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Request body is required.' }, { status: 400 })

  const vtuber = await getOwnedVtuberForSession(session.username)
  if (!vtuber) return NextResponse.json({ error: 'No claimed VTuber found.' }, { status: 403 })

  if (body.clear_all === true) {
    await supabaseAdmin.from('collab_notifications').update({ cleared: true }).eq('recipient', vtuber.id).eq('cleared', false)
    return NextResponse.json({ ok: true })
  }

  if (!body.id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 })
  }

  const { data: note } = await supabaseAdmin
    .from('collab_notifications')
    .select('id')
    .eq('id', body.id)
    .eq('recipient', vtuber.id)
    .single()

  if (!note) {
    return NextResponse.json({ error: 'Notification not found.' }, { status: 404 })
  }

  await supabaseAdmin.from('collab_notifications').update({ cleared: true }).eq('id', body.id)
  return NextResponse.json({ ok: true })
}
