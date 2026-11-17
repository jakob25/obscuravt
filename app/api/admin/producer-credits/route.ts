import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'
import { recordAuditLog } from '@/lib/audit-log'
import { parseCreditInput } from '@/lib/producers'

/**
 * Admin: add one credit. Needs the public release link that names the producer
 * (song_url) as proof; the VTuber must be an approved file.
 */
export async function POST(req: NextRequest) {
  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const parsed = parseCreditInput(body ?? {})
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const { data: vtuber } = await supabaseAdmin
    .from('vtubers')
    .select('id')
    .eq('id', parsed.value.vtuber_id)
    .eq('approved', true)
    .maybeSingle()
  if (!vtuber) return NextResponse.json({ error: 'That VTuber is not an approved file.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('producer_credits')
    .insert(parsed.value)
    .select('id')
    .single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'That credit is already on file.' }, { status: 409 })
    if (error.code === '23503') return NextResponse.json({ error: 'Unknown producer or VTuber.' }, { status: 400 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  await recordAuditLog(session.username, 'producer_credit_added', 'producer', parsed.value.producer_id, {
    credit_id: data?.id ?? null,
    vtuber_id: parsed.value.vtuber_id,
    role: parsed.value.role,
  })
  return NextResponse.json({ ok: true, id: data?.id ?? null })
}
