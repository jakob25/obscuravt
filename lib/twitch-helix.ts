/**
 * Twitch Helix helpers for clip/VOD thumbnails.
 * Prefers TWITCH_CLIENT_SECRET (app token that can be refreshed).
 * Falls back to TWITCH_ACCESS_TOKEN when no secret is set.
 */

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const CLIPS_URL = 'https://api.twitch.tv/helix/clips'
const VIDEOS_URL = 'https://api.twitch.tv/helix/videos'

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
  return /twitch_logo|ttv-static-metadata\/twitch/i.test(url)
}

function normalizeThumb(url: string | null | undefined): string | null {
  if (!url) return null
  const cleaned = url.replace(/%\{width\}/g, '480').replace(/%\{height\}/g, '272').trim()
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
