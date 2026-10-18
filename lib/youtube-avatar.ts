/**
 * Read-time YouTube profile pictures for creators with no avatar_url.
 * Server-only. Uses YOUTUBE_API_KEY (never sent to the client), caches each
 * API response for 24h via fetch revalidate, and never writes to the DB.
 * Any missing key / failure returns no avatar so the letter fallback stays.
 */

const DAY = 60 * 60 * 24
import { ALLOWED_HOSTS, safeFetch } from '@/lib/safe-fetch'
const API = 'https://www.googleapis.com/youtube/v3/channels'

type Row = {
  avatar_url?: string | null
  platform?: string | null
  link?: string | null
  handle?: string | null
}

type Target = { kind: 'id'; value: string } | { kind: 'handle'; value: string }

function emptyAvatar(v: string | null | undefined): boolean {
  return !(v && String(v).trim())
}

/** Work out a YouTube channel id or handle from the row, or null if it isn't a YouTube creator. */
export function youtubeTarget(row: Row): Target | null {
  const link = String(row.link || '').trim()
  let url: URL | null = null
  try {
    url = link ? new URL(link) : null
  } catch {
    url = null
  }
  const host = url?.hostname.toLowerCase().replace(/^(www|m)\./, '') || ''
  const isYtLink = host === 'youtube.com'
  const isYtPlatform = String(row.platform || '').toLowerCase().includes('youtube')
  if (!isYtLink && !isYtPlatform) return null

  if (isYtLink && url) {
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts[0] === 'channel' && /^UC[\w-]{22}$/.test(parts[1] || '')) return { kind: 'id', value: parts[1] }
    if (parts[0]?.startsWith('@') && parts[0].length > 1) return { kind: 'handle', value: decodeURIComponent(parts[0]) }
  }
  if (isYtPlatform) {
    const h = String(row.handle || '').trim().replace(/^@+/, '')
    if (/^UC[\w-]{22}$/.test(h)) return { kind: 'id', value: h }
    if (/^[\w.-]{3,30}$/.test(h)) return { kind: 'handle', value: `@${h}` }
  }
  return null
}

type ChannelsResponse = {
  items?: { id: string; snippet?: { thumbnails?: Record<string, { url?: string }> } }[]
}

function bestThumb(t: Record<string, { url?: string }> | undefined): string | null {
  return t?.high?.url || t?.medium?.url || t?.default?.url || null
}

async function channels(params: string, key: string): Promise<ChannelsResponse['items']> {
  try {
    const res = await safeFetch(`${API}?part=snippet&${params}&key=${encodeURIComponent(key)}`, ALLOWED_HOSTS.youtubeApi, {
      next: { revalidate: DAY },
    } as RequestInit)
    if (!res || !res.ok) return []
    const json = (await res.json()) as ChannelsResponse
    return json.items ?? []
  } catch {
    return []
  }
}

/**
 * Returns a copy of rows with avatar_url filled from YouTube where it was empty.
 * Rows that already have an avatar, or aren't YouTube creators, pass through unchanged.
 */
export async function withYoutubeAvatars<T extends Row>(rows: T[]): Promise<T[]> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key || rows.length === 0) return rows

  const targets = new Map<number, Target>()
  rows.forEach((row, i) => {
    if (!emptyAvatar(row.avatar_url)) return
    const t = youtubeTarget(row)
    if (t) targets.set(i, t)
  })
  if (targets.size === 0) return rows

  const byId = new Map<string, string>()
  const byHandle = new Map<string, string>()

  // Channel ids: up to 50 per call (1 quota unit per call).
  const ids = [...new Set([...targets.values()].filter(t => t.kind === 'id').map(t => t.value))].sort()
  for (let i = 0; i < ids.length; i += 50) {
    const items = await channels(`id=${ids.slice(i, i + 50).join(',')}`, key)
    for (const it of items ?? []) {
      const u = bestThumb(it.snippet?.thumbnails)
      if (u) byId.set(it.id, u)
    }
  }

  // Handles: forHandle takes one handle per call (1 unit each).
  const handles = [...new Set([...targets.values()].filter(t => t.kind === 'handle').map(t => t.value))]
  await Promise.all(
    handles.map(async h => {
      const items = await channels(`forHandle=${encodeURIComponent(h)}`, key)
      const u = bestThumb(items?.[0]?.snippet?.thumbnails)
      if (u) byHandle.set(h, u)
    })
  )

  return rows.map((row, i) => {
    const t = targets.get(i)
    if (!t) return row
    const url = t.kind === 'id' ? byId.get(t.value) : byHandle.get(t.value)
    return url ? { ...row, avatar_url: url } : row
  })
}
