import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { validateCollabRequestInput } from '@/lib/collab'

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
      .select('id,name,tags,claimed_by')
      .eq('id', userRow.active_vtuber_id)
      .eq('claimed_by', username)
      .single()

    if (activeVtuber) return activeVtuber
  }

  const { data: claimedVtubers } = await supabaseAdmin
    .from('vtubers')
    .select('id,name,tags,claimed_by')
    .eq('claimed_by', username)
    .limit(1)

  return claimedVtubers?.[0] ?? null
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { supabaseAdmin } = await import('@/lib/supabase')
  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ error: 'Request body is required.' }, { status: 400 })
  }

  const validation = validateCollabRequestInput({
    request_type: body.request_type,
    game_or_activity: body.game_or_activity,
    on_stream: body.on_stream,
    availability: body.availability,
    contact_twitter: body.contact_twitter,
    contact_discord: body.contact_discord,
    expires_in_days: body.expires_in_days,
  })

  if (!validation.valid) {
    return NextResponse.json({ error: 'Validation failed.', details: validation.errors }, { status: 400 })
  }

  const requester = await getOwnedVtuberForSession(session.username)
  if (!requester) {
    return NextResponse.json({ error: 'Only claimed VTubers can send collab requests.' }, { status: 403 })
  }

  const expiresInDays = Number(body.expires_in_days ?? 3)
  const safeExpiresInDays = Number.isFinite(expiresInDays) && expiresInDays > 0 ? Math.min(expiresInDays, 7) : 3
  const expiresAt = new Date(Date.now() + safeExpiresInDays * 24 * 60 * 60 * 1000).toISOString()

  const { data: requestRow, error: insertError } = await supabaseAdmin
    .from('collab_requests')
    .insert({
      vtuber_id: requester.id,
      request_type: body.request_type.trim(),
      game_or_activity: body.game_or_activity.trim(),
      on_stream: Boolean(body.on_stream),
      availability: body.availability?.trim() || null,
      contact_twitter: body.contact_twitter?.trim() || null,
      contact_discord: body.contact_discord?.trim() || null,
      expires_in_days: safeExpiresInDays,
      expires_at: expiresAt,
    })
    .select('*')
    .single()

  if (insertError || !requestRow) {
    return NextResponse.json({ error: insertError?.message ?? 'Failed to create collab request.' }, { status: 500 })
  }

  const { data: allClaimed } = await supabaseAdmin
    .from('vtubers')
    .select('id,tags,claimed_by')
    .not('claimed_by', 'is', null)
    .neq('id', requester.id)

  const requesterTags = Array.isArray(requester.tags) ? requester.tags.filter((tag): tag is string => typeof tag === 'string') : []
  const matchingVtubers = (allClaimed ?? []).filter(candidate => {
    const tags = Array.isArray(candidate.tags) ? candidate.tags.filter((tag): tag is string => typeof tag === 'string') : []
    return Boolean(candidate.claimed_by) && tags.some(tag => requesterTags.includes(tag))
  })

  if (matchingVtubers.length > 0) {
    const notifications = matchingVtubers.map(candidate => ({
      recipient: candidate.id,
      request_id: requestRow.id,
      cleared: false,
    }))

    const { error: notificationError } = await supabaseAdmin.from('collab_notifications').insert(notifications)
    if (notificationError) {
      return NextResponse.json({ error: notificationError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ request: requestRow, matchedCount: matchingVtubers.length })
}

export async function GET(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const requester = await getOwnedVtuberForSession(session.username)
  if (!requester) {
    return NextResponse.json([])
  }

  const { supabaseAdmin } = await import('@/lib/supabase')
  const now = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('collab_requests')
    .select('*')
    .eq('vtuber_id', requester.id)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
