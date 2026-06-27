import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { supabaseAdmin } = await import('@/lib/supabase')

  const { data: links } = await supabaseAdmin
    .from('user_claimed_profiles')
    .select('vtuber_id,claimed_at')
    .eq('username', session.username)
    .order('claimed_at', { ascending: true })

  const ids = (links ?? []).map(l => l.vtuber_id)
  if (ids.length === 0) {
    const { data: legacy } = await supabaseAdmin
      .from('vtubers')
      .select('id,name,avatar_url,bio,claimed_by')
      .eq('claimed_by', session.username)
    return NextResponse.json({
      profiles: (legacy ?? []).map(v => ({ id: v.id, name: v.name, avatar_url: v.avatar_url, bio: v.bio })),
      activeId: null,
    })
  }

  const { data: vtubers } = await supabaseAdmin.from('vtubers').select('id,name,avatar_url,bio').in('id', ids)
  const { data: user } = await supabaseAdmin.from('users').select('active_vtuber_id').eq('username', session.username).single()

  return NextResponse.json({
    profiles: vtubers ?? [],
    activeId: user?.active_vtuber_id ?? ids[0] ?? null,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { activeVtuberId } = await req.json()
  if (!activeVtuberId) return NextResponse.json({ error: 'activeVtuberId is required.' }, { status: 400 })

  const { supabaseAdmin } = await import('@/lib/supabase')

  const { data: link } = await supabaseAdmin
    .from('user_claimed_profiles')
    .select('vtuber_id')
    .eq('username', session.username)
    .eq('vtuber_id', activeVtuberId)
    .single()

  if (!link) {
    const { data: owned } = await supabaseAdmin
      .from('vtubers')
      .select('id')
      .eq('id', activeVtuberId)
      .eq('claimed_by', session.username)
      .single()
    if (!owned) return NextResponse.json({ error: 'You do not own this profile.' }, { status: 403 })
  }

  await supabaseAdmin.from('users').update({ active_vtuber_id: activeVtuberId }).eq('username', session.username)
  return NextResponse.json({ ok: true, activeVtuberId })
}