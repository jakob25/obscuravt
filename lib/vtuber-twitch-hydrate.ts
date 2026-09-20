import { supabaseAdmin } from '@/lib/supabase'
import { extractVideoId } from '@/lib/embed-utils'
import { helixClipBroadcasters, helixUserProfile, parseTwitchLogin } from '@/lib/twitch-helix'

function emptyText(v: string | null | undefined): boolean {
  return !(v && String(v).trim())
}

async function loginFromClips(profileId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('clips')
    .select('clip_url')
    .eq('profile_id', profileId)
    .not('clip_url', 'is', null)
    .limit(6)

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

/** Fill empty bio / avatar / handle / link from Helix Users. Never overwrite a written bio. */
export async function hydrateEmptyVtubersFromTwitch(limit = 12): Promise<{ scanned: number; filled: number }> {
  const { data, error } = await supabaseAdmin
    .from('vtubers')
    .select('id, name, handle, link, platform, bio, avatar_url')
    .eq('approved', true)
    .limit(400)

  if (error || !data) {
    if (error) console.error('hydrate twitch select', error.message)
    return { scanned: 0, filled: 0 }
  }

  const targets = data.filter(row => {
    const platform = (row.platform ?? '').toLowerCase()
    if (platform.includes('youtube') || platform.includes('twitter')) return false
    return emptyText(row.bio) || emptyText(row.avatar_url) || emptyText(row.link) || emptyText(row.handle)
  }).slice(0, limit)

  let filled = 0
  for (const row of targets) {
    const candidates = [row.link, row.handle, row.name].filter(Boolean) as string[]
    let profile = null as Awaited<ReturnType<typeof helixUserProfile>>
    for (const raw of candidates) {
      if (!parseTwitchLogin(raw) && !/^https?:/i.test(raw)) continue
      profile = await helixUserProfile(raw)
      if (profile?.login) break
    }
    if (!profile?.login) {
      const fromClip = await loginFromClips(row.id)
      if (fromClip) profile = await helixUserProfile(fromClip)
    }
    if (!profile?.login) continue

    const updates: Record<string, string> = {}
    if (emptyText(row.handle)) updates.handle = profile.login
    if (emptyText(row.link)) updates.link = `https://www.twitch.tv/${profile.login}`
    if (emptyText(row.platform)) updates.platform = 'Twitch'
    if (emptyText(row.avatar_url) && profile.profileImageUrl) updates.avatar_url = profile.profileImageUrl
    if (emptyText(row.bio) && profile.description) updates.bio = profile.description.slice(0, 500)

    if (Object.keys(updates).length === 0) continue
    const { error: upErr } = await supabaseAdmin.from('vtubers').update(updates).eq('id', row.id)
    if (upErr) {
      console.error('hydrate twitch update', row.id, upErr.message)
      continue
    }
    filled += 1
  }

  return { scanned: targets.length, filled }
}
