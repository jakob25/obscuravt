import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'
import { recordAuditLog } from '@/lib/audit-log'
import { parseProducerInput } from '@/lib/producers'
import { producerAvatarFromChannels } from '@/lib/producer-avatar'

/** Admin: producers on file (for the add-credit picker). */
export async function GET(req: NextRequest) {
  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session
  const { data, error } = await supabaseAdmin
    .from('producers')
    .select('id,name')
    .order('name')
    .limit(1000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ producers: data ?? [] })
}

/**
 * Admin: add a producer. The owner is the verification, so there is no public
 * form or pending queue; rows go live (approved defaults to true).
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
  const parsed = parseProducerInput(body ?? {})
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const row = { ...parsed.value, avatar_url: await producerAvatarFromChannels(parsed.value) }
  const { error } = await supabaseAdmin.from('producers').insert(row)
  if (error) {
    const status = error.code === '42P01' ? 503 : 500
    return NextResponse.json({ error: error.code === '42P01' ? 'Run migration 017 (producer files) first.' : error.message }, { status })
  }
  await recordAuditLog(session.username, 'producer_added', 'producer', row.id)
  return NextResponse.json({ ok: true, id: row.id, avatar: Boolean(row.avatar_url) })
}
