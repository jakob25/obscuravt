import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { getSupabaseAdminClient } from '@/lib/supabase'
import { creatorKeys, handleFromUrl, matchCreator } from '@/lib/creator-match'
import { copyLookupAvatarToBucket, isStoredVtuberAvatarUrl } from '@/lib/vtuber-avatar-copy'
import { clustersFromTagRows, nichesFromTagRows, validateNominationTags } from '@/lib/nomination-niche'

const supabaseAdmin = getSupabaseAdminClient()

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const body = await req.json()
  const { name, handle, platform, link, bio } = body

  const { data: catalogRows } = await supabaseAdmin
    .from('canonical_tags')
    .select('id, tag, category, sort_order, description, color')
    .in('category', ['niche_cluster', 'cluster'])
    .order('sort_order')
  const tagCheck = validateNominationTags(body.tags, {
    niches: nichesFromTagRows(catalogRows ?? []),
    clusters: clustersFromTagRows(catalogRows ?? []),
  })
  if (!tagCheck.ok) return NextResponse.json({ error: tagCheck.error }, { status: 400 })
  const tags = tagCheck.tags
  const submitted_by = session.username

  // Only a URL from /api/vtubers/avatar (our bucket) is accepted from the client.
  // Official profile pictures are copied server-side from a fresh lookup of `link`.
  const skipAvatar = body.skip_avatar === true
  let avatar_url = isStoredVtuberAvatarUrl(body.avatar_url) ? body.avatar_url : null
  if (!avatar_url && !skipAvatar && typeof link === 'string' && link.trim()) {
    avatar_url = await copyLookupAvatarToBucket(link, session.username)
  }

  if (!name?.trim())
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })

  // Duplicate check by name
  const { data: existing } = await supabaseAdmin
    .from('vtubers')
    .select('id, name')
    .ilike('name', name.trim())
    .single()

  if (existing)
    return NextResponse.json({ error: `${existing.name} is already in the Vault.` }, { status: 409 })

  // Also check by handle
  if (handle?.trim()) {
    const { data: byHandle } = await supabaseAdmin
      .from('vtubers')
      .select('id, name')
      .ilike('handle', handle.trim())
      .single()

    if (byHandle)
      return NextResponse.json({ error: `${byHandle.name} is already in the Vault (same handle).` }, { status: 409 })
  }

  // Handle/channel match across approved + pending (catches pending duplicates)
  const handleMatch = await matchCreator(creatorKeys({ handle: handle ?? null, link: link ?? null }))
  if (handleMatch.status === 'match')
    return NextResponse.json({ error: `${handleMatch.creator.name} is already in the Vault (same handle).` }, { status: 409 })
  if (handleMatch.status === 'pending')
    return NextResponse.json({ error: `${handleMatch.creator.name} has already been nominated and is waiting for approval.` }, { status: 409 })
  if (handleMatch.status === 'unsure')
    return NextResponse.json({ error: 'That handle already matches more than one creator. An admin will sort it out.' }, { status: 409 })

  const id = `vt_${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}_${randomUUID().slice(0, 6)}`

  const { error } = await supabaseAdmin.from('vtubers').insert({
    id,
    name: name.trim(),
    handle: handle?.trim() ?? '',
    platform: platform?.trim() ?? '',
    link: link?.trim() ?? '',
    bio: bio?.trim() ?? '',
    tags: tags ?? [],
    avatar_url: avatar_url ?? null,   // NEW: support uploaded avatar
    approved: false,
    nominated_by: submitted_by,
    spotlight: false,
  })

  if (error) return NextResponse.json({ error: 'Failed to submit VTuber.' }, { status: 500 })

  // Attach clips already waiting unlinked for this creator (handle match only)
  try {
    const keys = creatorKeys({ handle: handle ?? null, link: link ?? null })
    if (keys.length) {
      const { data: orphans } = await supabaseAdmin
        .from('clips').select('id, clip_url').is('profile_id', null).limit(1000)
      const ids = (orphans ?? []).filter(c => keys.includes(handleFromUrl(c.clip_url))).map(c => c.id)
      if (ids.length) await supabaseAdmin.from('clips').update({ profile_id: id }).in('id', ids).is('profile_id', null)
    }
  } catch (e) {
    console.error('nomination clip attach skipped:', e)
  }
  return NextResponse.json({ ok: true, id, pending: true }, { status: 201 })
}
