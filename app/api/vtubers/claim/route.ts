import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { vtuberId } = await req.json()
  if (!vtuberId) return NextResponse.json({ error: 'vtuberId is required.' }, { status: 400 })

  const { supabaseAdmin } = await import('@/lib/supabase')

  const { data: vtuber } = await supabaseAdmin
    .from('vtubers')
    .select('id,name,claimed_by,approved')
    .eq('id', vtuberId)
    .single()

  if (!vtuber || !vtuber.approved) {
    return NextResponse.json({ error: 'VTuber not found.' }, { status: 404 })
  }
  if (vtuber.claimed_by && vtuber.claimed_by !== session.username) {
    return NextResponse.json({ error: 'This profile is already claimed.' }, { status: 409 })
  }

  await supabaseAdmin.from('vtubers').update({ claimed_by: session.username }).eq('id', vtuberId)

  await supabaseAdmin.from('user_claimed_profiles').upsert({
    username: session.username,
    vtuber_id: vtuberId,
    claimed_at: new Date().toISOString(),
  }, { onConflict: 'username,vtuber_id' })

  const { data: user } = await supabaseAdmin.from('users').select('active_vtuber_id').eq('username', session.username).single()
  if (!user?.active_vtuber_id) {
    await supabaseAdmin.from('users').update({ active_vtuber_id: vtuberId }).eq('username', session.username)
  }

  return NextResponse.json({ ok: true, vtuberId, name: vtuber.name })
}