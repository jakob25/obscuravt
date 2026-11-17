/**
 * Producer files: music producers who make music for VTubers but aren't VTubers.
 * Pure helpers shared by the pages, admin API and tests. No data is invented here:
 * every value shown comes from a row the owner added through /admin.
 */
import { extractVideoId } from '@/lib/embed-utils'
import { ALLOWED_HOSTS, isAllowedHttpsUrl } from '@/lib/safe-fetch'

/** Fixed service list (the DB check constraint uses the same slugs). Labels live in site-copy. */
export const PRODUCER_SERVICES = [
  'original_songs',
  'stream_bgm',
  'covers_instrumentals',
  'mixing_mastering',
  'jingles_alerts',
] as const
export type ProducerService = (typeof PRODUCER_SERVICES)[number]

/** Fixed credit roles (the DB check constraint uses the same slugs). Labels live in site-copy. */
export const PRODUCER_ROLES = ['produced', 'composed', 'mixed', 'lyrics', 'bgm'] as const
export type ProducerRole = (typeof PRODUCER_ROLES)[number]

/** Link columns, in the order they're shown. SoundCloud is a plain link only (like Kick/Rumble). */
export const PRODUCER_LINK_KEYS = ['youtube', 'twitch', 'x', 'bluesky', 'soundcloud'] as const
export type ProducerLinkKey = (typeof PRODUCER_LINK_KEYS)[number]

export const PRODUCER_LIMITS = { name: 80, bio: 600, tag: 32, tags: 12, songTitle: 160 } as const

export interface ProducerRow {
  id: string
  name: string
  bio: string | null
  avatar_url: string | null
  genre_tags: string[] | null
  services: string[] | null
  commission_url: string | null
  portfolio_url: string | null
  youtube: string | null
  twitch: string | null
  x: string | null
  soundcloud: string | null
  bluesky: string | null
  approved?: boolean | null
  created_at?: string | null
}

export interface ProducerCreditRow {
  id: string
  producer_id: string
  vtuber_id: string
  song_title: string
  song_url: string
  role: string
  created_at?: string | null
}

export const PRODUCER_COLUMNS =
  'id,name,bio,avatar_url,genre_tags,services,commission_url,portfolio_url,youtube,twitch,x,soundcloud,bluesky,created_at'
export const PRODUCER_CREDIT_COLUMNS = 'id,producer_id,vtuber_id,song_title,song_url,role,created_at'

/** Same shape as VTuber ids (vt_<slug>_<hex>): pr_<slug>_<6 hex>. */
export function makeProducerId(name: string, hex: string = globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 6)): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'producer'
  return `pr_${slug}_${hex}`
}

export function isProducerId(id: unknown): id is string {
  return typeof id === 'string' && /^pr_[a-z0-9]{1,16}_[a-f0-9]{6}$/.test(id)
}

export function isProducerService(v: unknown): v is ProducerService {
  return typeof v === 'string' && (PRODUCER_SERVICES as readonly string[]).includes(v)
}

export function isProducerRole(v: unknown): v is ProducerRole {
  return typeof v === 'string' && (PRODUCER_ROLES as readonly string[]).includes(v)
}

/** https only, no credentials; returns the normalized URL or null. */
export function httpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null
    return url.toString()
  } catch {
    return null
  }
}

function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** Lowercase, deduped genre/mood tags (e.g. "lo-fi", "cozy", "j-pop"). */
export function normalizeGenreTags(value: unknown): string[] {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  const out: string[] = []
  for (const raw of list) {
    const tag = cleanText(raw, PRODUCER_LIMITS.tag).toLowerCase().replace(/^#+/, '')
    if (tag && !out.includes(tag)) out.push(tag)
    if (out.length >= PRODUCER_LIMITS.tags) break
  }
  return out
}

export type ProducerInsert = Omit<ProducerRow, 'created_at' | 'approved'>

/** Validate the admin "add producer" body. Optional links that aren't https are rejected, not dropped. */
export function parseProducerInput(body: Record<string, unknown>, hex?: string):
  { ok: true; value: ProducerInsert } | { ok: false; error: string } {
  const name = cleanText(body.name, PRODUCER_LIMITS.name)
  if (!name) return { ok: false, error: 'Name is required.' }
  const bio = typeof body.bio === 'string' ? body.bio.replace(/<[^>]*>/g, '').trim().slice(0, PRODUCER_LIMITS.bio) : ''
  const services = Array.isArray(body.services) ? body.services.filter(isProducerService) : []
  if (Array.isArray(body.services) && services.length !== body.services.length) {
    return { ok: false, error: 'Unknown service.' }
  }
  const links: Record<string, string | null> = {}
  for (const key of ['commission_url', 'portfolio_url', ...PRODUCER_LINK_KEYS] as const) {
    const raw = body[key]
    if (raw == null || (typeof raw === 'string' && !raw.trim())) { links[key] = null; continue }
    const url = httpsUrl(raw)
    if (!url) return { ok: false, error: `${key} must be an https:// link.` }
    links[key] = url
  }
  return {
    ok: true,
    value: {
      id: makeProducerId(name, hex),
      name,
      bio: bio || null,
      avatar_url: null,
      genre_tags: normalizeGenreTags(body.genre_tags),
      services: [...new Set(services)],
      commission_url: links.commission_url,
      portfolio_url: links.portfolio_url,
      youtube: links.youtube,
      twitch: links.twitch,
      x: links.x,
      soundcloud: links.soundcloud,
      bluesky: links.bluesky,
    },
  }
}

export type CreditInsert = Omit<ProducerCreditRow, 'id' | 'created_at'>

/** Validate the admin "add credit" body. song_url is the public proof and is required. */
export function parseCreditInput(body: Record<string, unknown>):
  { ok: true; value: CreditInsert } | { ok: false; error: string } {
  const producer_id = typeof body.producer_id === 'string' ? body.producer_id.trim() : ''
  if (!isProducerId(producer_id)) return { ok: false, error: 'Pick a producer.' }
  const vtuber_id = typeof body.vtuber_id === 'string' ? body.vtuber_id.trim() : ''
  if (!vtuber_id || vtuber_id.length > 80) return { ok: false, error: 'Pick a VTuber.' }
  const song_title = cleanText(body.song_title, PRODUCER_LIMITS.songTitle)
  if (!song_title) return { ok: false, error: 'Song title is required.' }
  const song_url = httpsUrl(body.song_url)
  if (!song_url) return { ok: false, error: 'Source link must be an https:// link to the public release.' }
  if (!isProducerRole(body.role)) return { ok: false, error: 'Pick a role.' }
  return { ok: true, value: { producer_id, vtuber_id, song_title, song_url, role: body.role } }
}

/** Picture only from the producer's own Twitch/YouTube CDN; anything else shows the placeholder. */
export function producerAvatar(row: Pick<ProducerRow, 'avatar_url'>): string | null {
  const raw = row.avatar_url ? String(row.avatar_url).trim() : ''
  return raw && isAllowedHttpsUrl(raw, ALLOWED_HOSTS.avatar) ? raw : null
}

/**
 * SoundCloud and Bluesky columns stay in the DB, but neither is shown anywhere
 * or offered in the admin form: SoundCloud until Jacob decides, Bluesky because
 * Jacob said in October we don't need it. Flip a flag to true to render it as a plain link.
 */
export const SHOW_SOUNDCLOUD = false
export const SHOW_BLUESKY = false

export interface LinkVisibility { showSoundcloud?: boolean; showBluesky?: boolean }

const HIDDEN_HOSTS: { key: 'soundcloud' | 'bluesky'; hosts: string[] }[] = [
  { key: 'soundcloud', hosts: ['soundcloud.com', 'on.soundcloud.com'] },
  { key: 'bluesky', hosts: ['bsky.app'] },
]

function shown(key: 'soundcloud' | 'bluesky', opts: LinkVisibility): boolean {
  return key === 'soundcloud' ? (opts.showSoundcloud ?? SHOW_SOUNDCLOUD) : (opts.showBluesky ?? SHOW_BLUESKY)
}

/** Link columns the admin form offers (hidden networks aren't offered). */
export function adminLinkKeys(opts: LinkVisibility = {}): ProducerLinkKey[] {
  return PRODUCER_LINK_KEYS.filter(k => (k === 'soundcloud' || k === 'bluesky' ? shown(k, opts) : true))
}

/** False for a URL on a hidden network (e.g. a SoundCloud page pasted as the portfolio). */
export function isShownUrl(url: string, opts: LinkVisibility = {}): boolean {
  let host = ''
  try { host = new URL(url).hostname.toLowerCase().replace(/^(www|m)\./, '') } catch { return false }
  return HIDDEN_HOSTS.every(h => shown(h.key, opts) || !h.hosts.includes(host))
}

/** Portfolio link if present, valid, and not on a hidden network. */
export function producerPortfolio(row: Pick<ProducerRow, 'portfolio_url'>, opts: LinkVisibility = {}): string | null {
  const url = httpsUrl(row.portfolio_url)
  return url && isShownUrl(url, opts) ? url : null
}

/** Social links that are present and valid, in display order. Hidden networks are skipped. */
export function producerLinks(
  row: Partial<Record<ProducerLinkKey, string | null>>,
  opts: LinkVisibility = {},
): { key: ProducerLinkKey; url: string }[] {
  const out: { key: ProducerLinkKey; url: string }[] = []
  for (const key of PRODUCER_LINK_KEYS) {
    if ((key === 'soundcloud' || key === 'bluesky') && !shown(key, opts)) continue
    const url = httpsUrl(row[key])
    if (url && !isShownUrl(url, opts)) continue
    if (url) out.push({ key, url })
  }
  return out
}

/** Known services only, in the fixed order. */
export function producerServices(row: Pick<ProducerRow, 'services'>): ProducerService[] {
  const set = new Set((row.services ?? []).filter(isProducerService))
  return PRODUCER_SERVICES.filter(s => set.has(s))
}

/** YouTube video id for a normal YouTube embed; null for every other host (no other embeds). */
export function youtubeEmbedId(songUrl: string): string | null {
  if (!httpsUrl(songUrl)) return null
  const parsed = extractVideoId(songUrl)
  return parsed?.platform === 'youtube' && /^[\w-]{11}$/.test(parsed.videoId) ? parsed.videoId : null
}

/** Every genre/mood tag across producers, most used first, then A–Z. */
export function genreTagCounts(rows: Pick<ProducerRow, 'genre_tags'>[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const row of rows) for (const tag of new Set(row.genre_tags ?? [])) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

/** Directory filter: a genre/mood tag and/or a service; unknown filters are ignored. */
export function filterProducers<T extends Pick<ProducerRow, 'genre_tags' | 'services'>>(
  rows: T[],
  filter: { tag?: string | null; service?: string | null },
): T[] {
  const tag = filter.tag ? filter.tag.trim().toLowerCase() : ''
  const service = isProducerService(filter.service) ? filter.service : null
  return rows.filter(row =>
    (!tag || (row.genre_tags ?? []).includes(tag)) &&
    (!service || (row.services ?? []).includes(service)),
  )
}

/** Case number for the file header, same pattern as OVT-xxxxx on VTuber files. */
export function producerCaseId(id: string): string {
  return `OVT-PR-${String(id).replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase().padStart(5, '0')}`
}

/** The Studio niche (canonical_tags.id). The Booth is linked from its creators' files only; not a niche itself. */
export const STUDIO_NICHE_ID = 'nclust_studio'
