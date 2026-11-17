import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { recordAuditLog } from '@/lib/audit-log'

/** Admin: list claim requests (pending first). */
export async function GET(req: NextRequest) {
  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session
  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data, error } = await supabaseAdmin
    .from('profile_claim_requests')
    .select('id,vtuber_id,requested_by,proof_link,message,status,reviewed_by,reviewed_at,created_at, vtubers(name,link,claimed_by)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data ?? [] })
}

/**
 * Admin: approve or reject one request. Approval is the only place a site claim is granted:
 * sets claimed_by to the requester, is_claimed and claim_approved_at, and links the profile —
 * and only if nobody else holds the file.
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
  const id = typeof body.id === 'string' ? body.id : ''
  const decision = body.decision === 'approve' ? 'approved' : body.decision === 'reject' ? 'rejected' : null
  if (!id || !decision) return NextResponse.json({ error: 'id and decision (approve/reject) are required.' }, { status: 400 })

  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data: request } = await supabaseAdmin
    .from('profile_claim_requests')
    .select('id,vtuber_id,requested_by,status')
    .eq('id', id)
    .maybeSingle()
  if (!request) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
  if (request.status !== 'pending') return NextResponse.json({ error: `Already ${request.status}.` }, { status: 409 })

  const now = new Date().toISOString()
  if (decision === 'approved') {
    const { data: vtuber } = await supabaseAdmin
      .from('vtubers')
      .select('id,claimed_by,approved')
      .eq('id', request.vtuber_id)
      .maybeSingle()
    if (!vtuber || !vtuber.approved) return NextResponse.json({ error: 'File not found.' }, { status: 404 })
    if (vtuber.claimed_by && vtuber.claimed_by !== request.requested_by) {
      return NextResponse.json({ error: `Already claimed by @${vtuber.claimed_by}.` }, { status: 409 })
    }
    // Only grant if still unclaimed (or already this person's) at write time
    const grant = supabaseAdmin
      .from('vtubers')
      .update({ claimed_by: request.requested_by, is_claimed: true, claim_approved_at: now })
      .eq('id', request.vtuber_id)
    const { data: granted, error: grantErr } = await (vtuber.claimed_by
      ? grant.eq('claimed_by', request.requested_by)
      : grant.is('claimed_by', null)
    ).select('id')
    if (grantErr || !granted || granted.length === 0) {
      return NextResponse.json({ error: 'Could not grant the claim (it may have just been claimed).' }, { status: 409 })
    }
    await supabaseAdmin.from('user_claimed_profiles').upsert(
      { username: request.requested_by, vtuber_id: request.vtuber_id, claimed_at: now },
      { onConflict: 'username,vtuber_id' },
    )
  }

  await supabaseAdmin
    .from('profile_claim_requests')
    .update({ status: decision, reviewed_by: session.username, reviewed_at: now })
    .eq('id', id)
  await recordAuditLog(session.username, `claim_${decision}`, 'vtuber', request.vtuber_id, { request_id: id, requested_by: request.requested_by })

  return NextResponse.json({ ok: true, status: decision })
}
