import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { allowSignedOutClipSubmit } from '@/lib/flags'
import { rateLimits } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { extractVideoId, resolveClipThumbnail } from '@/lib/embed-utils'
import { helixClipThumbnails } from '@/lib/twitch-helix'
import { backfillMissingVtuberChannelLinks } from '@/lib/vtuber-channel-link'
import { hydrateVtuberById } from '@/lib/vtuber-twitch-hydrate'
import { randomUUID } from 'crypto'
import { handleFromUrl, matchCreator } from '@/lib/creator-match'
import { maybeAwardClipPostScraps } from '@/lib/clip-rewards'

/**
 * Link a clip to a creator by handle only (never display name).
 * Approved or pending-nomination matches link; none/unsure stays unlinked for review.
 * Never creates creators.
 */
async function resolveClipProfile(opts: {
  profileId: string | null
  nameFromBody: string
  clipUrl: string
  hintHandles: string[]
}): Promise<{ profileId: string | null; resolvedName: string | null; matchStatus: string }> {
  const { profileId, nameFromBody, clipUrl, hintHandles } = opts
  if (profileId) {
    const { data: vtuber } = await supabaseAdmin.from('vtubers').select('id, name').eq('id', profileId).maybeSingle()
    if (vtuber) return { profileId: vtuber.id, resolvedName: nameFromBody || vtuber.name, matchStatus: 'chosen' }
  }
  const r = await matchCreator([handleFromUrl(clipUrl), ...hintHandles])
  if (r.status === 'match' || r.status === 'pending') {
    return { profileId: r.creator.id, resolvedName: r.creator.name, matchStatus: r.status }
  }
  return { profileId: null, resolvedName: nameFromBody || null, matchStatus: r.status === 'unsure' ? 'needs_review_unsure' : 'needs_review' }
}

/** Resolve missing thumbs and cache on the row when column exists. */
async function enrichClipThumbnails(rows: any[]) {
  const twitchIds: string[] = []
  for (const row of rows) {
    if (row.thumbnail_url || !row.clip_url) continue
    const extracted = extractVideoId(row.clip_url as string)
    if (extracted?.platform === 'twitch' && !extracted.videoId.startsWith('v')) {
      twitchIds.push(extracted.videoId)
    }
  }

  let helixMap: Record<string, string> = {}
  try {
    helixMap = await helixClipThumbnails(twitchIds)
  } catch (e) {
    console.error('helix batch thumb error:', e)
  }

  const out = []
  for (const row of rows) {
    if (row.thumbnail_url) {
      out.push(row)
      continue
    }
    const url = row.clip_url as string | undefined
    if (!url) {
      out.push(row)
      continue
    }

    const extracted = extractVideoId(url)
    let thumb: string | null = null
    if (extracted?.platform === 'twitch' && helixMap[extracted.videoId]) {
      thumb = helixMap[extracted.videoId]
    } else {
      thumb = await resolveClipThumbnail(url)
    }

    if (thumb) {
      await supabaseAdmin.from('clips').update({ thumbnail_url: thumb }).eq('id', row.id)
      out.push({ ...row, thumbnail_url: thumb })
    } else {
      out.push(row)
    }
  }
  return out
}

export async function GET() {
  try {
    await backfillMissingVtuberChannelLinks(25)
  } catch (e) {
    console.error('vtuber channel link backfill error:', e)
  }

  const { data, error } = await supabaseAdmin
    .from('clips')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch clips.' }, { status: 500 })

  try {
    const enriched = await enrichClipThumbnails(data ?? [])
    return NextResponse.json(enriched)
  } catch (e) {
    console.error('clip thumb enrich error:', e)
    return NextResponse.json(data)
  }
}

export async function POST(req: NextRequest) {
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await getSession(req)
  if (!session && !allowSignedOutClipSubmit()) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const profile_id = typeof body.profile_id === 'string' && body.profile_id.trim() ? body.profile_id.trim() : null
  const title = typeof body.title === 'string' ? body.title : ''
  const url = typeof body.url === 'string' ? body.url : ''
  const description = typeof body.description === 'string' ? body.description : null
  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === 'string') : []
  const nameFromBody = typeof body.vtuber_name === 'string' ? body.vtuber_name.trim() : ''
  const username = session?.username ?? 'guest'

  if (!title.trim())
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  if (!url.trim())
    return NextResponse.json({ error: 'Video URL is required.' }, { status: 400 })

  if (!profile_id && !nameFromBody) {
    return NextResponse.json(
      { error: 'Select a VTuber or enter their name.' },
      { status: 400 }
    )
  }

  const { data: existing } = await supabaseAdmin
    .from('clips')
    .select('id')
    .eq('clip_url', url.trim())
    .maybeSingle()

  if (existing)
    return NextResponse.json({ error: 'This clip is already in the archive.' }, { status: 409 })

  // Same clip under a different URL form (e.g. clips.twitch.tv/X vs twitch.tv/user/clip/X)
  const submittedId = extractVideoId(url.trim())?.videoId
  if (submittedId) {
    const { data: sameId } = await supabaseAdmin
      .from('clips')
      .select('clip_url')
      .ilike('clip_url', `%${submittedId.replace(/^v(\d+)$/, '$1')}%`)
      .limit(10)
    if ((sameId ?? []).some(c => extractVideoId(c.clip_url || '')?.videoId === submittedId))
      return NextResponse.json({ error: 'This clip is already in the archive.' }, { status: 409 })
  }

  const hintHandles = Array.isArray(body.handles)
    ? body.handles.filter((h): h is string => typeof h === 'string').slice(0, 10)
    : []
  const resolved = await resolveClipProfile({
    profileId: profile_id,
    nameFromBody,
    clipUrl: url.trim(),
    hintHandles,
  })

  let thumbnail_url: string | null = null
  try {
    thumbnail_url = await resolveClipThumbnail(url.trim())
  } catch {
    thumbnail_url = null
  }

  const clipId = randomUUID()
  const baseRow: Record<string, unknown> = {
    id: clipId,
    profile_id: resolved.profileId,
    submitter: username,
    title: title.trim(),
    clip_url: url.trim(),
    description: description?.trim() || null,
    tags,
    vtuber_name: resolved.resolvedName,
    upvotes: 0,
    created_at: new Date().toISOString(),
    thumbnail_url,
  }

  let { error } = await supabaseAdmin.from('clips').insert(baseRow)

  if (error && resolved.profileId && (error.code === '23503' || /foreign key|profile_id|uuid|invalid input/i.test(error.message))) {
    console.error('clips insert retry without profile_id:', error.message)
    const retryRow = { ...baseRow, profile_id: null }
    const retry = await supabaseAdmin.from('clips').insert(retryRow)
    error = retry.error
  }

  if (error && /column|thumbnail_url|vtuber_name|description|does not exist/i.test(error.message)) {
    console.error('clips insert schema retry:', error.message)
    const minimal: Record<string, unknown> = {
      id: clipId,
      profile_id: resolved.profileId,
      submitter: username,
      title: title.trim(),
      clip_url: url.trim(),
      tags,
      upvotes: 0,
      created_at: new Date().toISOString(),
    }
    if (/profile_id/i.test(error.message)) minimal.profile_id = null
    if (/tags/i.test(error.message)) delete minimal.tags
    if (!/thumbnail_url/i.test(error.message) && thumbnail_url) {
      minimal.thumbnail_url = thumbnail_url
    }
    const retry = await supabaseAdmin.from('clips').insert(minimal)
    error = retry.error
    if (error && /thumbnail_url/i.test(error.message)) {
      delete minimal.thumbnail_url
      const retry2 = await supabaseAdmin.from('clips').insert(minimal)
      error = retry2.error
    }
  }

  if (error) {
    console.error('clips insert failed:', error.message, error.code, error.details, error.hint)
    return NextResponse.json(
      {
        error: 'Failed to submit clip.',
        detail: error.message,
        code: error.code ?? null,
        hint: error.hint ?? null,
      },
      { status: 500 }
    )
  }

  if (resolved.profileId) {
    try {
      await hydrateVtuberById(resolved.profileId)
    } catch (e) {
      console.error('clip stub twitch hydrate', e)
    }
  }

  let scrap_award = null
  try {
    scrap_award = await maybeAwardClipPostScraps(
      session?.username,
      clipId,
      async (fn, args) => {
        const { data, error } = await supabaseAdmin.rpc(fn, args)
        return { data, error }
      },
    )
  } catch (e) {
    console.error('clip post scrap award', e)
  }

  return NextResponse.json(
    {
      ok: true,
      profile_id: resolved.profileId,
      match_status: resolved.matchStatus,
      thumbnail_url,
      scrap_award,
    },
    { status: 201 }
  )
}
