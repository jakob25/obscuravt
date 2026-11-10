/**
 * Trim an X, YouTube, or Twitch profile (or video/clip) URL down to a
 * structured link the nomination lookup can use. Returns null when the
 * input is not one of those platforms.
 */
const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'm.youtu.be',
])

const TWITCH_HOSTS = new Set([
  'twitch.tv',
  'www.twitch.tv',
  'm.twitch.tv',
  'clips.twitch.tv',
])

const X_HOSTS = new Set([
  'x.com',
  'www.x.com',
  'mobile.x.com',
  'm.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
  'm.twitter.com',
])

const TWITCH_RESERVED = new Set([
  'videos', 'clips', 'directory', 'p', 'settings', 'subs', 'inventory',
  'downloads', 'jobs', 'turbo', 'prime', 'search', 'popout',
])

const X_RESERVED = new Set([
  'home', 'explore', 'search', 'notifications', 'messages', 'i', 'settings',
  'compose', 'intent', 'privacy', 'tos', 'about', 'signup', 'login', 'logout',
  'share', 'hashtag', 'topics', 'communities', 'premium', 'jobs', 'download',
  'help', 'advertise', 'flow', 'following', 'followers', 'bookmarks', 'lists',
  'community', 'search-advanced', 'tos', 'login',
])

const YT_CHANNEL_ID = /^UC[\w-]{22}$/
const YT_HANDLE = /^[\w.-]{1,30}$/
const YT_VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/
const TWITCH_LOGIN = /^[a-zA-Z0-9_]{3,25}$/
const TWITCH_CLIP_ID = /^[a-zA-Z0-9_-]+$/
const X_HANDLE = /^[A-Za-z0-9_]{1,15}$/

export type NormalizedProfileLink =
  | {
      platform: 'twitch'
      kind: 'channel' | 'clip' | 'video'
      inputUrl: string
      profileUrl: string | null
      login: string | null
      clipId: string | null
      videoId: string | null
    }
  | {
      platform: 'youtube'
      kind: 'handle' | 'id' | 'user' | 'custom' | 'video'
      inputUrl: string
      profileUrl: string
      handle: string | null
      channelId: string | null
      username: string | null
      customName: string | null
      videoId: string | null
    }
  | {
      platform: 'twitter'
      kind: 'profile'
      inputUrl: string
      profileUrl: string
      handle: string
    }

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
  if (host && (YT_HOSTS.has(host) || TWITCH_HOSTS.has(host) || X_HOSTS.has(host))) {
    return `https://${raw}`
  }
  return raw
}

function parseUrl(value: string): URL | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 2048) return null
  try {
    const url = new URL(toAbsoluteUrl(trimmed))
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    return url
  } catch {
    return null
  }
}

function youtubeVideoId(url: URL, parts: string[]): string | null {
  const host = url.hostname.toLowerCase()
  if (host === 'youtu.be' || host === 'www.youtu.be' || host === 'm.youtu.be') {
    const id = parts[0] ? decodePart(parts[0]) : null
    return id && YT_VIDEO_ID.test(id) ? id : null
  }
  const watch = url.searchParams.get('v')
  if (watch && YT_VIDEO_ID.test(watch)) return watch
  if ((parts[0] === 'embed' || parts[0] === 'live' || parts[0] === 'shorts') && parts[1] && YT_VIDEO_ID.test(parts[1])) {
    return parts[1]
  }
  return null
}

function parseYouTube(url: URL): NormalizedProfileLink | null {
  const inputUrl = url.toString()
  const parts = url.pathname.split('/').filter(Boolean).map(decodePart)
  if (parts.some(part => part == null)) return null
  const segments = parts as string[]
  const videoId = youtubeVideoId(url, segments)
  if (videoId) {
    return {
      platform: 'youtube',
      kind: 'video',
      inputUrl,
      profileUrl: `https://www.youtube.com/watch?v=${videoId}`,
      handle: null,
      channelId: null,
      username: null,
      customName: null,
      videoId,
    }
  }

  const first = segments[0] ?? ''
  if (first === 'channel' && segments[1] && YT_CHANNEL_ID.test(segments[1])) {
    return {
      platform: 'youtube',
      kind: 'id',
      inputUrl,
      profileUrl: `https://www.youtube.com/channel/${segments[1]}`,
      handle: null,
      channelId: segments[1],
      username: null,
      customName: null,
      videoId: null,
    }
  }
  if (first.startsWith('@')) {
    const handle = first.slice(1)
    if (!YT_HANDLE.test(handle)) return null
    return {
      platform: 'youtube',
      kind: 'handle',
      inputUrl,
      profileUrl: `https://www.youtube.com/@${handle}`,
      handle,
      channelId: null,
      username: null,
      customName: null,
      videoId: null,
    }
  }
  if (first === 'user' && segments[1]) {
    const username = segments[1]
    if (!/^[A-Za-z0-9._-]{1,40}$/.test(username)) return null
    return {
      platform: 'youtube',
      kind: 'user',
      inputUrl,
      profileUrl: `https://www.youtube.com/user/${username}`,
      handle: null,
      channelId: null,
      username,
      customName: null,
      videoId: null,
    }
  }
  if (first === 'c' && segments[1]) {
    const customName = segments[1]
    if (!/^[A-Za-z0-9._-]{1,64}$/.test(customName)) return null
    return {
      platform: 'youtube',
      kind: 'custom',
      inputUrl,
      profileUrl: `https://www.youtube.com/c/${customName}`,
      handle: null,
      channelId: null,
      username: null,
      customName,
      videoId: null,
    }
  }
  return null
}

function parseTwitch(url: URL): NormalizedProfileLink | null {
  const inputUrl = url.toString()
  const host = url.hostname.toLowerCase()
  const parts = url.pathname.split('/').filter(Boolean).map(decodePart)
  if (parts.some(part => part == null)) return null
  const segments = (parts as string[]).map(s => s)

  if (host === 'clips.twitch.tv') {
    const clipId = segments[0]
    if (!clipId || !TWITCH_CLIP_ID.test(clipId) || TWITCH_RESERVED.has(clipId.toLowerCase())) return null
    return {
      platform: 'twitch',
      kind: 'clip',
      inputUrl,
      profileUrl: null,
      login: null,
      clipId,
      videoId: null,
    }
  }

  const first = segments[0] ?? ''
  const second = (segments[1] ?? '').toLowerCase()

  if (first.toLowerCase() === 'videos' && /^\d+$/.test(segments[1] || '')) {
    return {
      platform: 'twitch',
      kind: 'video',
      inputUrl,
      profileUrl: null,
      login: null,
      clipId: null,
      videoId: segments[1],
    }
  }

  if (first && !TWITCH_RESERVED.has(first.toLowerCase()) && TWITCH_LOGIN.test(first)) {
    const login = first.toLowerCase()
    if (second === 'clip' && segments[2] && TWITCH_CLIP_ID.test(segments[2])) {
      return {
        platform: 'twitch',
        kind: 'clip',
        inputUrl,
        profileUrl: `https://www.twitch.tv/${login}`,
        login,
        clipId: segments[2],
        videoId: null,
      }
    }
    if ((second === 'video' || second === 'videos') && /^\d+$/.test(segments[2] || '')) {
      return {
        platform: 'twitch',
        kind: 'video',
        inputUrl,
        profileUrl: `https://www.twitch.tv/${login}`,
        login,
        clipId: null,
        videoId: segments[2],
      }
    }
    return {
      platform: 'twitch',
      kind: 'channel',
      inputUrl,
      profileUrl: `https://www.twitch.tv/${login}`,
      login,
      clipId: null,
      videoId: null,
    }
  }
  return null
}

function parseX(url: URL): NormalizedProfileLink | null {
  const inputUrl = url.toString()
  const parts = url.pathname.split('/').filter(Boolean).map(decodePart)
  if (parts.some(part => part == null)) return null
  const segments = parts as string[]
  const rawHandle = (segments[0] ?? '').replace(/^@+/, '')
  if (!rawHandle || X_RESERVED.has(rawHandle.toLowerCase()) || !X_HANDLE.test(rawHandle)) return null
  const handle = rawHandle.toLowerCase()
  return {
    platform: 'twitter',
    kind: 'profile',
    inputUrl,
    profileUrl: `https://x.com/${handle}`,
    handle,
  }
}

export function normalizeVtuberProfileLink(value: string | null | undefined): NormalizedProfileLink | null {
  const url = parseUrl(value as string)
  if (!url) return null
  const host = url.hostname.toLowerCase()
  if (YT_HOSTS.has(host)) return parseYouTube(url)
  if (TWITCH_HOSTS.has(host)) return parseTwitch(url)
  if (X_HOSTS.has(host)) return parseX(url)
  return null
}
