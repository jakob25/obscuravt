import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'
import { recordAuditLog } from '@/lib/audit-log'

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session

  const { data, error } = await supabaseAdmin
    .from('vtubers')
    .select('id,name,handle,platform,link,bio,tags,avatar_url,nominated_by,created_at,approved')
    .eq('approved', false)
    .order('nominated_by', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pending: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session

  const { vtuberId, approved } = await req.json()
  if (!vtuberId || typeof approved !== 'boolean') {
    return NextResponse.json({ error: 'vtuberId and approved (boolean) are required.' }, { status: 400 })
  }

  if (approved) {
    const { error } = await supabaseAdmin.from('vtubers').update({ approved: true }).eq('id', vtuberId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await recordAuditLog(session.username, 'vtuber_approved', 'vtuber', vtuberId)
    return NextResponse.json({ ok: true, approved: true })
  }

  const { error } = await supabaseAdmin.from('vtubers').delete().eq('id', vtuberId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await recordAuditLog(session.username, 'vtuber_rejected', 'vtuber', vtuberId)
  return NextResponse.json({ ok: true, approved: false })
}