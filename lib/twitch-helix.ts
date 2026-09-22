/**
 * Twitch Helix helpers for clip/VOD thumbnails.
 * Prefers TWITCH_CLIENT_SECRET (app token that can be refreshed).
 * Falls back to TWITCH_ACCESS_TOKEN when no secret is set.
 */

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const CLIPS_URL = 'https://api.twitch.tv/helix/clips'
const VIDEOS_URL = 'https://api.twitch.tv/helix/videos'
const USERS_URL = 'https://api.twitch.tv/helix/users'
const STREAMS_URL = 'https://api.twitch.tv/helix/streams'

let cachedAppToken: { token: string; expiresAt: number } | null = null

function clientId(): string | undefined {
  return process.env.TWITCH_CLIENT_ID || undefined
}

function staticAccessToken(): string | undefined {
  return process.env.TWITCH_ACCESS_TOKEN || undefined
}

function clientSecret(): string | undefined {
  return process.env.TWITCH_CLIENT_SECRET || undefined
}

async function mintAppToken(): Promise<string | null> {
  const id = clientId()
  const secret = clientSecret()
  if (!id || !secret) return null

  if (cachedAppToken && Date.now() < cachedAppToken.expiresAt - 60_000) {
    return cachedAppToken.token
  }

  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    grant_type: 'client_credentials',
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })
  if (!res.ok) {
    console.error('twitch client-credentials failed:', res.status, await res.text().catch(() => ''))
    return null
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) return null
  cachedAppToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, data.expires_in ?? 3600) * 1000,
  }
  return cachedAppToken.token
}

async function resolveAccessToken(): Promise<string | null> {
  if (cachedAppToken && Date.now() < cachedAppToken.expiresAt - 60_000) {
    return cachedAppToken.token
  }
  if (clientSecret()) {
    const minted = await mintAppToken()
    if (minted) return minted
  }
  return staticAccessToken() ?? null
}

function helixHeaders(token: string): HeadersInit {
  return {
    'Client-ID': clientId() as string,
    Authorization: `Bearer ${token}`,
  }
}

function isGenericTwitchLogo(url: string): boolean {
  return url.includes('twitch_logo') || url.includes('ttv-static-metadata/twitch')
}

function normalizeThumb(url: string | null | undefined): string | null {
  if (!url) return null
  const cleaned = url.replace(/%{width}/g, '480').replace(/%{height}/g, '272').trim()
  if (!cleaned || isGenericTwitchLogo(cleaned)) return null
  return cleaned
}

async function helixGet(
  url: string,
  token: string
): Promise<{ status: number; json: any }> {
  const res = await fetch(url, {
    headers: helixHeaders(token),
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null)
  return { status: res.status, json }
}

async function helixGetWithRefresh(url: string): Promise<{ status: number; json: any } | null> {
  let token = await resolveAccessToken()
  if (!token || !clientId()) return null

  let result = await helixGet(url, token)
  if ((result.status === 401 || result.status === 403) && clientSecret()) {
    cachedAppToken = null
    token = await mintAppToken()
    if (!token) return result
    result = await helixGet(url, token)
  }
  return result
}

/** Clip slug from clips.twitch.tv / twitch.tv/{chan}/clip/{slug} */
export async function helixClipThumbnail(clipId: string): Promise<string | null> {
  const map = await helixClipThumbnails([clipId])
  return map[clipId] ?? null
}

/** Batch Get Clips — max 100 ids per Helix request. */
export async function helixClipThumbnails(clipIds: string[]): Promise<Record<string, string>> {
  const ids = [...new Set(clipIds.filter(id => !!id && !id.startsWith('v')))]
  const out: Record<string, string> = {}
  if (!clientId() || ids.length === 0) return out

  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100)
    const url = `${CLIPS_URL}?${chunk.map(id => `id=${encodeURIComponent(id)}`).join('&')}`
    const result = await helixGetWithRefresh(url)
    if (!result) continue
    if (result.status !== 200) {
      console.error('helix clips status', result.status, result.json?.message ?? result.json)
      continue
    }
    for (const row of result.json?.data ?? []) {
      const thumb = normalizeThumb(row.thumbnail_url)
      if (thumb && row.id) out[row.id] = thumb
    }
  }
  return out
}

/** Numeric VOD id, with or without leading `v`. */
export async function helixVodThumbnail(videoId: string): Promise<string | null> {
  const numeric = videoId.replace(/^v/i, '')
  if (!clientId() || !/^\d+$/.test(numeric)) return null

  const result = await helixGetWithRefresh(`${VIDEOS_URL}?id=${encodeURIComponent(numeric)}`)
  if (!result) return null
  if (result.status !== 200) {
    console.error('helix videos status', result.status, result.json?.message ?? result.json)
    return null
  }
  return normalizeThumb(result.json?.data?.[0]?.thumbnail_url)
}

const TWITCH_RESERVED = new Set([
  'videos', 'clips', 'directory', 'p', 'settings', 'subs', 'inventory',
  'downloads', 'jobs', 'turbo', 'prime', 'search', 'popout',
])

/** Login from a Twitch URL, handle, or raw login. */
export function parseTwitchLogin(input: string): string | null {
  const raw = (input || '').trim()
  if (!raw) return null

  const asUrl = raw.includes('://')
    ? raw
    : /twitch\.tv/i.test(raw)
      ? `https://${raw}`
      : ''

  if (asUrl) {
    try {
      const u = new URL(asUrl)
      const host = u.hostname.replace(/^www\./i, '').toLowerCase()
      if (host === 'twitch.tv' || host.endsWith('.twitch.tv')) {
        const part = u.pathname.split('/').filter(Boolean)[0]
        if (part && !TWITCH_RESERVED.has(part.toLowerCase()) && /^[a-zA-Z0-9_]{3,25}$/.test(part)) {
          return part.toLowerCase()
        }
      }
    } catch {
      /* fall through */
    }
  }

  if (/^[a-zA-Z0-9_]{3,25}$/.test(raw)) return raw.toLowerCase()
  return null
}

export type HelixChannelPresence = {
  login: string
  live: boolean
  liveTitle: string | null
  liveStartedAt: string | null
  liveUrl: string
  lastTitle: string | null
  lastAt: string | null
  lastUrl: string | null
}

/** Live stream + latest archive for a Twitch login or channel URL. */
export async function helixChannelPresence(loginOrUrl: string): Promise<HelixChannelPresence | null> {
  const login = parseTwitchLogin(loginOrUrl)
  if (!login || !clientId()) return null

  const userRes = await helixGetWithRefresh(`${USERS_URL}?login=${encodeURIComponent(login)}`)
  if (!userRes || userRes.status !== 200) {
    if (userRes && userRes.status !== 200) {
      console.error('helix users status', userRes.status, userRes.json?.message ?? userRes.json)
    }
    return null
  }
  const user = userRes.json?.data?.[0]
  if (!user?.id) return null

  const liveUrl = `https://www.twitch.tv/${user.login || login}`

  const [streamRes, videoRes] = await Promise.all([
    helixGetWithRefresh(`${STREAMS_URL}?user_id=${encodeURIComponent(user.id)}`),
    helixGetWithRefresh(`${VIDEOS_URL}?user_id=${encodeURIComponent(user.id)}&type=archive&first=1`),
  ])

  const stream = streamRes?.status === 200 ? streamRes.json?.data?.[0] : null
  const video = videoRes?.status === 200 ? videoRes.json?.data?.[0] : null

  return {
    login: user.login || login,
    live: !!stream,
    liveTitle: stream?.title ? String(stream.title) : null,
    liveStartedAt: stream?.started_at ? String(stream.started_at) : null,
    liveUrl,
    lastTitle: video?.title ? String(video.title) : null,
    lastAt: video?.created_at ? String(video.created_at) : null,
    lastUrl: video?.url ? String(video.url) : video ? `${liveUrl}/videos` : null,
  }
}

/** Confirmed Twitch login for a handle/URL. Users lookup only. */
export async function helixUserLogin(loginOrUrl: string): Promise<string | null> {
  const profile = await helixUserProfile(loginOrUrl)
  return profile?.login ?? null
}

/** Clip slug → broadcaster_login from Helix Get Clips. Never the clipper URL path. */
export async function helixClipBroadcasters(clipIds: string[]): Promise<Record<string, string>> {
  const ids = [...new Set(clipIds.filter(id => !!id && !id.startsWith('v')))]
  const out: Record<string, string> = {}
  if (!clientId() || ids.length === 0) return out

  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100)
    const url = `${CLIPS_URL}?${chunk.map(id => `id=${encodeURIComponent(id)}`).join('&')}`
    const result = await helixGetWithRefresh(url)
    if (!result) continue
    if (result.status !== 200) {
      console.error('helix clip broadcasters status', result.status, result.json?.message ?? result.json)
      continue
    }
    for (const row of result.json?.data ?? []) {
      const login = String(row.broadcaster_login || '').toLowerCase()
      if (row.id && login) out[row.id] = login
    }
  }
  return out
}

export type HelixUserProfile = {
  login: string
  displayName: string
  description: string
  profileImageUrl: string
}

/** Current Twitch login + display name. Old logins resolve to the renamed login. */
export async function helixUserProfile(loginOrUrl: string): Promise<HelixUserProfile | null> {
  const login = parseTwitchLogin(loginOrUrl)
  if (!login || !clientId()) return null
  const userRes = await helixGetWithRefresh(`${USERS_URL}?login=${encodeURIComponent(login)}`)
  if (!userRes || userRes.status !== 200) return null
  const user = userRes.json?.data?.[0]
  if (!user) return null
  return {
    login: String(user.login || login).toLowerCase(),
    displayName: String(user.display_name || user.login || login),
    description: user.description ? String(user.description) : '',
    profileImageUrl: user.profile_image_url ? String(user.profile_image_url) : '',
  }
}

export type HelixClipDetails = {
  id: string
  title: string | null
  thumbnailUrl: string | null
  broadcasterLogin: string | null
  broadcasterName: string | null
  videoId: string | null
}

/** Helix Get Clips — title, thumb, broadcaster for a clip slug. */
export async function helixClipDetails(clipId: string): Promise<HelixClipDetails | null> {
  const id = (clipId || '').trim()
  if (!id || id.startsWith('v') || !clientId()) return null
  const result = await helixGetWithRefresh(`${CLIPS_URL}?id=${encodeURIComponent(id)}`)
  if (!result || result.status !== 200) return null
  const row = result.json?.data?.[0]
  if (!row?.id) return null
  return {
    id: String(row.id),
    title: row.title ? String(row.title) : null,
    thumbnailUrl: normalizeThumb(row.thumbnail_url),
    broadcasterLogin: row.broadcaster_login ? String(row.broadcaster_login).toLowerCase() : null,
    broadcasterName: row.broadcaster_name ? String(row.broadcaster_name) : null,
    videoId: row.video_id ? String(row.video_id) : null,
  }
}

/** Helix Get Videos title for a numeric VOD id (with or without leading v). */
export async function helixVodTitle(videoId: string): Promise<string | null> {
  const numeric = String(videoId || '').replace(/^v/i, '')
  if (!clientId() || !/^\d+$/.test(numeric)) return null
  const result = await helixGetWithRefresh(`${VIDEOS_URL}?id=${encodeURIComponent(numeric)}`)
  if (!result || result.status !== 200) return null
  const title = result.json?.data?.[0]?.title
  return title ? String(title) : null
}
