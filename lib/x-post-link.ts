/**
 * Trim an X/Twitter post URL down to the plain address stored in
 * niche_photo_posts.post_url. Returns null when the input is not a
 * single post link.
 */
export const X_POST_URL_CHECK =
  /^https:\/\/(x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/status\/[0-9]+$/

const HOSTS = new Set([
  'x.com',
  'www.x.com',
  'mobile.x.com',
  'm.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
  'm.twitter.com',
])

const HANDLE = /^[A-Za-z0-9_]{1,15}$/
const STATUS_ID = /^[0-9]{1,25}$/

function decodePart(part: string): string | null {
  try {
    return decodeURIComponent(part)
  } catch {
    return null
  }
}

function toAbsoluteUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('//')) return `https:${raw}`
  const host = raw.split(/[/?#]/, 1)[0]?.toLowerCase()
  if (host && HOSTS.has(host)) return `https://${raw}`
  return raw
}

function extraPathIsPostSuffix(rest: string[]): boolean {
  if (rest.length === 0) return true
  const kind = rest[0].toLowerCase()
  if (kind === 'analytics') return rest.length === 1
  if (kind === 'photo' || kind === 'video') {
    return rest.length === 1 || (rest.length === 2 && /^\d+$/.test(rest[1]))
  }
  return false
}

export function normalizeXPostLink(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 2048) return null

  let url: URL
  try {
    url = new URL(toAbsoluteUrl(trimmed))
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  const host = url.hostname.toLowerCase()
  if (!HOSTS.has(host)) return null

  const parts = url.pathname.split('/').filter(Boolean).map(decodePart)
  if (parts.some(part => part == null)) return null
  const segments = parts as string[]

  let handle: string | undefined
  let statusId: string | undefined
  if (
    segments.length >= 4 &&
    segments[0].toLowerCase() === 'i' &&
    segments[1].toLowerCase() === 'web' &&
    segments[2].toLowerCase() === 'status'
  ) {
    handle = 'i'
    statusId = segments[3]
    if (!extraPathIsPostSuffix(segments.slice(4))) return null
  } else if (segments.length >= 3 && segments[1].toLowerCase() === 'status') {
    const rawHandle = segments[0].startsWith('@') ? segments[0].slice(1) : segments[0]
    handle = rawHandle
    statusId = segments[2]
    if (!extraPathIsPostSuffix(segments.slice(3))) return null
  } else {
    return null
  }

  if (!handle || !statusId || !HANDLE.test(handle) || !STATUS_ID.test(statusId)) return null

  const normalized = `https://x.com/${handle.toLowerCase()}/status/${statusId}`
  return X_POST_URL_CHECK.test(normalized) ? normalized : null
}
