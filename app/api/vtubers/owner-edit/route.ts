import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { canEditOwnFile, validateOwnerEdit } from '@/lib/owner-edit'

/**
 * Claimed creators edit their own file. Server-enforced: session user must be the
 * approved claimant (canEditOwnFile). Bio, picture, link, handle, tags are writable.
 * Name and claim columns stay locked. Previous values are logged first.
 */
export async function PATCH(req: NextRequest) {
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
  if (!vtuberId) return NextResponse.json({ error: 'vtuberId is required.' }, { status: 400 })

  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data: row } = await supabaseAdmin
    .from('vtubers')
    .select('id,bio,avatar_url,link,handle,tags,claimed_by,claim_approved_at')
    .eq('id', vtuberId)
    .maybeSingle()
  if (!row) return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  if (!(await canEditOwnFile(session.username, vtuberId, row))) {
    return NextResponse.json({ error: 'Only the approved owner of this file can edit it.' }, { status: 403 })
  }

  const checked = validateOwnerEdit(
    { bio: body.bio, avatar_url: body.avatar_url, link: body.link, handle: body.handle, tags: body.tags },
    session.username,
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  )
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 })

  // Keep the previous version first; if that can't be saved, don't edit.
  const prev = Object.fromEntries(Object.keys(checked.updates).map(k => [k, (row as Record<string, unknown>)[k] ?? null]))
  const { error: logErr } = await supabaseAdmin.from('automation_log').insert({
    action: 'owner_edit_prev',
    vtuber_id: vtuberId,
    tag: JSON.stringify({ by: session.username, at: new Date().toISOString(), prev }),
  })
  if (logErr) {
    console.error('owner edit history write failed', logErr.message)
    return NextResponse.json({ error: "We couldn't save your edit just now. Try again in a minute." }, { status: 500 })
  }

  const { error } = await supabaseAdmin
    .from('vtubers')
    .update(checked.updates)
    .eq('id', vtuberId)
    .eq('claimed_by', session.username)
  if (error) {
    console.error('owner edit update failed', error.message)
    return NextResponse.json({ error: "We couldn't save your edit just now. Try again in a minute." }, { status: 500 })
  }
  return NextResponse.json({ ok: true, updated: Object.keys(checked.updates) })
}

/** Current fields and whether the signed-in user may edit this file. */
export async function GET(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session
  const vtuberId = req.nextUrl.searchParams.get('vtuberId')?.trim() ?? ''
  if (!vtuberId) return NextResponse.json({ error: 'vtuberId is required.' }, { status: 400 })
  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data: row } = await supabaseAdmin
    .from('vtubers')
    .select('id,bio,avatar_url,link,handle,tags,claimed_by,claim_approved_at')
    .eq('id', vtuberId)
    .maybeSingle()
  const canEdit = await canEditOwnFile(session.username, vtuberId, row)
  if (!canEdit || !row) return NextResponse.json({ canEdit: false })
  return NextResponse.json({
    canEdit: true,
    bio: row.bio ?? '',
    avatar_url: row.avatar_url ?? null,
    link: row.link ?? '',
    handle: row.handle ?? '',
    tags: Array.isArray(row.tags) ? row.tags : [],
  })
}
