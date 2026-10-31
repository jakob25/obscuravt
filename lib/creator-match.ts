/**
 * Handle-only creator matching shared by clip submit, the suggestion
 * endpoint, the nominator and the admin queue. Never matches display names.
 */
import { supabaseAdmin } from '@/lib/supabase'

export type CreatorRow = { id: string; name: string; handle: string | null; link: string | null; approved: boolean | null }
export type MatchResult =
  | { status: 'match'; creator: CreatorRow; via: string }
  | { status: 'pending'; creator: CreatorRow; via: string }
  | { status: 'none' }
  | { status: 'unsure'; candidates: CreatorRow[] }

const HANDLE_RE = /^[a-z0-9_.-]{2,40}$/
const RESERVED = new Set(['i', 'intent', 'home', 'search', 'share', 'videos', 'clip', 'clips', 'watch', 'channel', 'c', 'user', 'status', 'directory', 'embed', 'shorts', 'live'])

/** Lowercase, strip @ and whitespace. Returns '' when not handle-shaped. */
export function normalizeHandle(raw: string | null | undefined): string {
  const h = (raw ?? '').trim().toLowerCase().replace(/^@+/, '')
  return HANDLE_RE.test(h) && !RESERVED.has(h) ? h : ''
}

/** Pull a creator handle out of a Twitch / X / YouTube / Kick URL. */
export function handleFromUrl(raw: string | null | undefined): string {
  if (!raw) return ''
  let u: URL
  try { u = new URL(raw.trim().startsWith('http') ? raw.trim() : `https://${raw.trim()}`) } catch { return '' }
  const host = u.hostname.replace(/^(www\.|m\.|mobile\.)/, '').toLowerCase()
  const parts = u.pathname.split('/').filter(Boolean)
  const first = parts[0] ?? ''
  if (host === 'twitch.tv' || host === 'kick.com' || host === 'x.com' || host === 'twitter.com' || host === 'fxtwitter.com' || host === 'vxtwitter.com') {
    return normalizeHandle(first)
  }
  if (host === 'youtube.com') {
    if (first.startsWith('@')) return normalizeHandle(first)
    if ((first === 'c' || first === 'user') && parts[1]) return normalizeHandle(parts[1])
    if (first === 'channel' && parts[1]) return parts[1].toLowerCase()
  }
  return ''
}

/** All handle keys a creator row is known by (handle column + handle in link). */
export function creatorKeys(row: Pick<CreatorRow, 'handle' | 'link'>): string[] {
  const keys = new Set<string>()
  const h = normalizeHandle(row.handle) || handleFromUrl(row.handle)
  if (h) keys.add(h)
  const l = handleFromUrl(row.link)
  if (l) keys.add(l)
  return [...keys]
}

export async function loadCreators(): Promise<CreatorRow[]> {
  if (!supabaseAdmin) return []
  const { data } = await supabaseAdmin.from('vtubers').select('id, name, handle, link, approved').limit(5000)
  return (data ?? []) as CreatorRow[]
}

/** Match handles (strongest first) against approved + pending creators. */
export function matchHandles(handles: string[], creators: CreatorRow[]): MatchResult {
  const wanted = [...new Set(handles.map(h => normalizeHandle(h) || handleFromUrl(h)).filter(Boolean))]
  for (const key of wanted) {
    const hits = creators.filter(c => creatorKeys(c).includes(key))
    if (hits.length > 1) return { status: 'unsure', candidates: hits }
    if (hits.length === 1) {
      const creator = hits[0]
      return { status: creator.approved ? 'match' : 'pending', creator, via: key }
    }
  }
  return { status: 'none' }
}

export async function matchCreator(handles: string[]): Promise<MatchResult> {
  return matchHandles(handles, await loadCreators())
}

/** Pull @mentions out of an X oEmbed html blob. */
export function mentionsFromHtml(html: string | null | undefined): string[] {
  if (!html) return []
  const out = new Set<string>()
  for (const m of html.matchAll(/(?:^|[^\w/])@([A-Za-z0-9_]{1,15})\b/g)) {
    const h = normalizeHandle(m[1])
    if (h) out.add(h)
  }
  return [...out]
}
