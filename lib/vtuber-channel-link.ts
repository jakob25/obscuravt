import { supabaseAdmin } from '@/lib/supabase'
import { helixChannelPresence, parseTwitchLogin } from '@/lib/twitch-helix'

function hasHttpLink(link: string | null | undefined): boolean {
  return !!(link && /^https?:\/\//i.test(link.trim()))
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

  const candidates = [row.handle, row.name].filter(Boolean) as string[]
  for (const raw of candidates) {
    if (!parseTwitchLogin(raw)) continue
    const presence = await helixChannelPresence(raw)
    if (!presence?.login) continue

    const link = `https://www.twitch.tv/${presence.login}`
    const updates: Record<string, string> = { link }
    if (!row.platform?.trim()) updates.platform = 'Twitch'
    if (!row.handle?.trim()) updates.handle = presence.login

    const { error } = await supabaseAdmin.from('vtubers').update(updates).eq('id', row.id)
    if (error) console.error('persistTwitchChannelLink failed', row.id, error.message)
    return link
  }

  return null
}

export async function backfillMissingVtuberChannelLinks(limit = 25): Promise<{ scanned: number; filled: number }> {
  const { data, error } = await supabaseAdmin
    .from('vtubers')
    .select('id, name, handle, link, platform')
    .eq('approved', true)
    .limit(400)

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
