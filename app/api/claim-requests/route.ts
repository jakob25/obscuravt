import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { cleanMessage, cleanProofLink } from '@/lib/claim-requests'

/**
 * A signed-in person asks to claim a creator file. This only records a PENDING request in
 * profile_claim_requests; it never touches vtubers.claimed_by / is_claimed. A human admin
 * approves or rejects it in /admin (app/api/admin/claim-requests).
 */
export async function POST(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Something was wrong with the form. Try again.' }, { status: 400 })
  }
  const vtuberId = typeof body.vtuberId === 'string' ? body.vtuberId.trim() : ''
  if (!vtuberId) return NextResponse.json({ error: 'Pick the file you want to claim.' }, { status: 400 })
  const proof = cleanProofLink(body.proofLink)
  if (!proof.ok) return NextResponse.json({ error: proof.error }, { status: 400 })
  const message = cleanMessage(body.message)
  if (!message.ok) return NextResponse.json({ error: message.error }, { status: 400 })

  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data: vtuber } = await supabaseAdmin
    .from('vtubers')
    .select('id,name,approved,claimed_by')
    .eq('id', vtuberId)
    .maybeSingle()
  if (!vtuber || !vtuber.approved) return NextResponse.json({ error: "We couldn't find that file." }, { status: 404 })
  if (vtuber.claimed_by) {
    const mine = vtuber.claimed_by === session.username
    return NextResponse.json({ error: mine ? 'This file is already linked to your account.' : 'This file has already been claimed.' }, { status: 409 })
  }

  const { data: existing } = await supabaseAdmin
    .from('profile_claim_requests')
    .select('id')
    .eq('vtuber_id', vtuberId)
    .eq('requested_by', session.username)
    .eq('status', 'pending')
    .limit(1)
  if (existing && existing.length > 0) {
    return NextResponse.json({ ok: true, status: 'pending', duplicate: true })
  }

  const { error } = await supabaseAdmin.from('profile_claim_requests').insert({
    vtuber_id: vtuberId,
    requested_by: session.username,
    proof_link: proof.value,
    message: message.value,
    status: 'pending',
  })
  if (error) {
    console.error('claim request insert failed', error.message)
    return NextResponse.json({ error: "We couldn't save your request just now. Try again in a minute." }, { status: 500 })
  }
  return NextResponse.json({ ok: true, status: 'pending' })
}

/** The signed-in person's own requests, so /claim can show "pending". */
export async function GET(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session
  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data } = await supabaseAdmin
    .from('profile_claim_requests')
    .select('id,vtuber_id,status,created_at')
    .eq('requested_by', session.username)
    .order('created_at', { ascending: false })
    .limit(20)
  return NextResponse.json({ requests: data ?? [] })
}
