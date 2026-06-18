import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionUser } from '@/lib/session'

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Simple admin check - improve later with proper roles
  const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'blujayrx').split(',')
  if (!ADMIN_USERNAMES.includes(user.username)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('profile_claim_requests')
    .select(`
      *,
      vtubers:vtuber_id (name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten the data
  const formatted = data.map((row: any) => ({
    ...row,
    vtuber_name: row.vtubers?.name || null,
  }))

  return NextResponse.json(formatted)
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'blujayrx').split(',')
  if (!ADMIN_USERNAMES.includes(user.username)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { claimId, action } = await req.json()

  if (!claimId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Get the claim
  const { data: claim } = await supabaseAdmin
    .from('profile_claim_requests')
    .select('*')
    .eq('id', claimId)
    .single()

  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
  }

  if (action === 'approve') {
    // Set claimed_by on the vtuber
    await supabaseAdmin
      .from('vtubers')
      .update({ claimed_by: claim.requested_by })
      .eq('id', claim.vtuber_id)

    // Update claim status
    await supabaseAdmin
      .from('profile_claim_requests')
      .update({
        status: 'approved',
        reviewed_by: user.username,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', claimId)

    return NextResponse.json({ ok: true, message: 'Claim approved' })
  }

  if (action === 'reject') {
    await supabaseAdmin
      .from('profile_claim_requests')
      .update({
        status: 'rejected',
        reviewed_by: user.username,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', claimId)

    return NextResponse.json({ ok: true, message: 'Claim rejected' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
