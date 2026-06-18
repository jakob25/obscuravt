import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionUser } from '@/lib/session'

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to claim a profile.' }, { status: 401 })
  }

  const { vtuberId, proofLink, message } = await req.json()

  if (!vtuberId) {
    return NextResponse.json({ error: 'VTuber ID is required.' }, { status: 400 })
  }

  // Check if VTuber exists and is not already claimed
  const { data: vtuber } = await supabaseAdmin
    .from('vtubers')
    .select('id, claimed_by, name')
    .eq('id', vtuberId)
    .single()

  if (!vtuber) {
    return NextResponse.json({ error: 'VTuber not found.' }, { status: 404 })
  }

  if (vtuber.claimed_by) {
    return NextResponse.json({ error: 'This profile is already claimed.' }, { status: 400 })
  }

  // Check if user already has a pending claim for this VTuber
  const { data: existing } = await supabaseAdmin
    .from('profile_claim_requests')
    .select('id')
    .eq('vtuber_id', vtuberId)
    .eq('requested_by', user.username)
    .eq('status', 'pending')
    .single()

  if (existing) {
    return NextResponse.json({ error: 'You already have a pending claim for this profile.' }, { status: 400 })
  }

  // Create claim request
  const { error } = await supabaseAdmin
    .from('profile_claim_requests')
    .insert({
      vtuber_id: vtuberId,
      requested_by: user.username,
      proof_link: proofLink || null,
      message: message || null,
      status: 'pending',
    })

  if (error) {
    return NextResponse.json({ error: 'Failed to submit claim request.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Claim request submitted successfully.' })
}
