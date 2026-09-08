/**
 * Twitch Helix helpers for clip/VOD thumbnails.
 * Uses existing TWITCH_CLIENT_ID + TWITCH_ACCESS_TOKEN.
 * Optionally refreshes via TWITCH_CLIENT_SECRET (client-credentials).
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
  const minted = cachedAppToken && Date.now() < cachedAppToken.expiresAt - 60_000 ? cachedAppToken.token : null
  if (minted) return minted
  if (staticAccessToken()) return staticAccessToken() as string
  return mintAppToken()
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
    next: { revalidate: 3600 },
  } as RequestInit)
  const json = await res.json().catch(() => null)
  return { status: res.status, json }
}

/** Clip slug from clips.twitch.tv / twitch.tv/{chan}/clip/{slug} */
export async function helixClipThumbnail(clipId: string): Promise<string | null> {
  const id = clientId()
  if (!id || !clipId || clipId.startsWith('v')) return null

  let token = await resolveAccessToken()
  if (!token) return null

  const url = `${CLIPS_URL}?id=${encodeURIComponent(clipId)}`
  let { status, json } = await helixGet(url, token)

  if ((status === 401 || status === 403) && clientSecret()) {
    cachedAppToken = null
    token = await mintAppToken()
    if (!token) return null
    ;({ status, json } = await helixGet(url, token))
  }

  if (status !== 200) {
    console.error('helix clips status', status, json?.message ?? json)
    return null
  }

  const thumb = json?.data?.[0]?.thumbnail_url as string | undefined
  return normalizeThumb(thumb)
}

/** Numeric VOD id, with or without leading `v`. */
export async function helixVodThumbnail(videoId: string): Promise<string | null> {
  const id = clientId()
  const numeric = videoId.replace(/^v/i, '')
  if (!id || !/^\d+$/.test(numeric)) return null

  let token = await resolveAccessToken()
  if (!token) return null

  const url = `${VIDEOS_URL}?id=${encodeURIComponent(numeric)}`
  let { status, json } = await helixGet(url, token)

  if ((status === 401 || status === 403) && clientSecret()) {
    cachedAppToken = null
    token = await mintAppToken()
    if (!token) return null
    ;({ status, json } = await helixGet(url, token))
  }

  if (status !== 200) {
    console.error('helix videos status', status, json?.message ?? json)
    return null
  }

  const thumb = json?.data?.[0]?.thumbnail_url as string | undefined
  return normalizeThumb(thumb)
}
