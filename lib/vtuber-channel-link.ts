import { supabaseAdmin } from '@/lib/supabase'
import { extractVideoId } from '@/lib/embed-utils'
import { helixClipBroadcasters, helixUserLogin, helixUserProfile, parseTwitchLogin } from '@/lib/twitch-helix'

function hasHttpLink(link: string | null | undefined): boolean {
  return !!(link && /^https?:\/\//i.test(link.trim()))
}

function compactKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function writeChannelIdentity(
  row: { id: string; name?: string | null; handle?: string | null; platform?: string | null; link?: string | null },
  login: string,
  displayName?: string | null
): Promise<{ link: string; handle: string; name: string }> {
  const link = `https://www.twitch.tv/${login}`
  const updates: Record<string, string> = { link, handle: login }
  if (!row.platform?.trim()) updates.platform = 'Twitch'

  const oldLogin = parseTwitchLogin(row.handle || '') || parseTwitchLogin(row.link || '') || ''
  const nameKey = compactKey(row.name || '')
  const nameLooksLikeLogin =
    !!nameKey &&
    (nameKey === compactKey(row.handle || '') || nameKey === compactKey(oldLogin) || nameKey === compactKey(login))

  if (displayName && (oldLogin !== login || nameLooksLikeLogin)) {
    updates.name = displayName
  }

  const { error } = await supabaseAdmin.from('vtubers').update(updates).eq('id', row.id)
  if (error) console.error('writeChannelIdentity failed', row.id, error.message)
  return {
    link,
    handle: login,
    name: updates.name || row.name || login,
  }
}

async function broadcasterLoginFromProfileClips(profileId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('clips')
    .select('clip_url')
    .eq('profile_id', profileId)
    .not('clip_url', 'is', null)
    .limit(8)

  if (error) {
    console.error('profile clips for channel link', profileId, error.message)
    return null
  }

  const slugs: string[] = []
  for (const row of data ?? []) {
    const extracted = extractVideoId(String(row.clip_url || ''))
    if (extracted?.platform === 'twitch' && !extracted.videoId.startsWith('v')) {
      slugs.push(extracted.videoId)
    }
  }
  if (slugs.length === 0) return null

  const map = await helixClipBroadcasters(slugs)
  return Object.values(map)[0] ?? null
}

export async function persistTwitchChannelLink(row: {
  id: string
  name?: string | null
  handle?: string | null
  link?: string | null
  platform?: string | null
}): Promise<string | null> {
  const synced = await syncTwitchChannelIdentity(row)
  return synced?.link ?? null
}

/** Fill missing link, and replace stored handle/name when Helix login changed. */
export async function syncTwitchChannelIdentity(row: {
  id: string
  name?: string | null
  handle?: string | null
  link?: string | null
  platform?: string | null
}): Promise<{ link: string; handle: string; name: string } | null> {
  const platform = (row.platform ?? '').toLowerCase()
  if (platform.includes('youtube') || platform.includes('twitter')) {
    return row.link ? { link: row.link.trim(), handle: row.handle || '', name: row.name || '' } : null
  }

  const candidates = [row.link, row.handle, row.name].filter(Boolean) as string[]
  for (const raw of candidates) {
    const profile = await helixUserProfile(raw)
    if (!profile?.login) continue
    return writeChannelIdentity(row, profile.login, profile.displayName)
  }

  const fromClips = await broadcasterLoginFromProfileClips(row.id)
  if (fromClips) {
    const profile = await helixUserProfile(fromClips)
    return writeChannelIdentity(row, profile?.login || fromClips, profile?.displayName || null)
  }

  if (hasHttpLink(row.link)) {
    return { link: row.link!.trim(), handle: row.handle || '', name: row.name || '' }
  }
  return null
}

export async function backfillMissingVtuberChannelLinks(limit = 25): Promise<{ scanned: number; filled: number }> {
  const { data, error } = await supabaseAdmin
    .from('vtubers')
    .select('id, name, handle, link, platform')
    .limit(2000)

  if (error || !data) {
    if (error) console.error('backfill channel links select', error.message)
    return { scanned: 0, filled: 0 }
  }

  const missing = data.filter(v => !hasHttpLink(v.link)).slice(0, limit)
  let filled = 0
  for (const row of missing) {
    const link = await persistTwitchChannelLink(row)
    if (link) filled += 1
  }
  return { scanned: missing.length, filled }
}

export async function syncExistingTwitchIdentities(limit = 40): Promise<{ scanned: number; updated: number }> {
  const { data, error } = await supabaseAdmin
    .from('vtubers')
    .select('id, name, handle, link, platform')
    .limit(2000)

  if (error || !data) {
    if (error) console.error('sync identities select', error.message)
    return { scanned: 0, updated: 0 }
  }

  const linked = data.filter(v => hasHttpLink(v.link) || parseTwitchLogin(v.handle || '')).slice(0, limit)
  let updated = 0
  for (const row of linked) {
    const before = `${row.handle || ''}|${row.name || ''}|${row.link || ''}`
    const synced = await syncTwitchChannelIdentity(row)
    if (!synced) continue
    const after = `${synced.handle}|${synced.name}|${synced.link}`
    if (after !== before) updated += 1
  }
  return { scanned: linked.length, updated }
}
