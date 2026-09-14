import { supabaseAdmin } from '@/lib/supabase'
import { extractVideoId } from '@/lib/embed-utils'
import { helixClipBroadcasters, helixUserLogin, parseTwitchLogin } from '@/lib/twitch-helix'

function hasHttpLink(link: string | null | undefined): boolean {
  return !!(link && /^https?:\/\//i.test(link.trim()))
}

async function writeChannelLink(
  row: { id: string; handle?: string | null; platform?: string | null },
  login: string
): Promise<string> {
  const link = `https://www.twitch.tv/${login}`
  const updates: Record<string, string> = { link }
  if (!row.platform?.trim()) updates.platform = 'Twitch'
  if (!row.handle?.trim()) updates.handle = login

  const { error } = await supabaseAdmin.from('vtubers').update(updates).eq('id', row.id)
  if (error) console.error('persistTwitchChannelLink failed', row.id, error.message)
  return link
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
  if (hasHttpLink(row.link)) return row.link!.trim()

  const platform = (row.platform ?? '').toLowerCase()
  if (platform.includes('youtube') || platform.includes('twitter')) {
    return row.link?.trim() || null
  }

  const candidates = [row.handle, row.name, row.link].filter(Boolean) as string[]
  for (const raw of candidates) {
    if (!parseTwitchLogin(raw)) continue
    const login = await helixUserLogin(raw)
    if (!login) continue
    return writeChannelLink(row, login)
  }

  const fromClips = await broadcasterLoginFromProfileClips(row.id)
  if (fromClips) return writeChannelLink(row, fromClips)

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
