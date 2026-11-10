/**
 * Official, free profile lookup for a pasted X, YouTube, or Twitch link.
 * Never invents a name, bio, or avatar: missing data stays null.
 */
import { ALLOWED_HOSTS, safeFetch } from '@/lib/safe-fetch'
import { sanitizeVtuberBio } from '@/lib/vtuber-bio-sanitize'
import { normalizeVtuberProfileLink, type NormalizedProfileLink } from '@/lib/vtuber-profile-link'
import { youtubeChannelProfile, type YoutubeChannelProfile } from '@/lib/youtube-avatar'
import { helixClipDetails, helixUserProfile, helixVodBroadcaster, type HelixUserProfile } from '@/lib/twitch-helix'
import { VTUBER_SUBMIT } from '@/lib/site-copy'

export const LOOKUP_TIMEOUT_MS = 8_000

export type VtuberProfileLookup = {
  platform: 'Twitch' | 'YouTube' | 'Twitter'
  link: string
  name: string | null
  handle: string | null
  bio: string | null
  avatarUrl: string | null
  partial: boolean
  message: string | null
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(null), ms)
    promise.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        clearTimeout(timer)
        resolve(null)
      },
    )
  })
}

function blank(platform: VtuberProfileLookup['platform'], link: string, message: string, extras: Partial<VtuberProfileLookup> = {}): VtuberProfileLookup {
  return {
    platform,
    link,
    name: null,
    handle: extras.handle ?? null,
    bio: null,
    avatarUrl: null,
    partial: true,
    message,
  }
}

function fromYoutubeChannel(profile: YoutubeChannelProfile): VtuberProfileLookup {
  const bio = sanitizeVtuberBio(profile.description)
  const handle = profile.handle || null
  return {
    platform: 'YouTube',
    link: handle ? `https://www.youtube.com/@${handle}` : `https://www.youtube.com/channel/${profile.id}`,
    name: profile.title,
    handle,
    bio: bio || null,
    avatarUrl: profile.avatarUrl,
    partial: false,
    message: null,
  }
}

function fromTwitchProfile(profile: HelixUserProfile): VtuberProfileLookup {
  const bio = sanitizeVtuberBio(profile.description)
  return {
    platform: 'Twitch',
    link: `https://www.twitch.tv/${profile.login}`,
    name: profile.displayName || null,
    handle: profile.login,
    bio: bio || null,
    avatarUrl: profile.profileImageUrl || null,
    partial: !profile.displayName,
    message: profile.displayName ? null : VTUBER_SUBMIT.lookupFailed,
  }
}

async function youtubeFromQuery(
  query: { kind: 'id' | 'handle' | 'username'; value: string },
  fallbackLink: string,
): Promise<VtuberProfileLookup> {
  const profile = await youtubeChannelProfile(query, { timeoutMs: LOOKUP_TIMEOUT_MS })
  if (!profile) return blank('YouTube', fallbackLink, VTUBER_SUBMIT.lookupFailed)
  return fromYoutubeChannel(profile)
}

async function youtubeChannelFromVideo(videoUrl: string, fallbackLink: string): Promise<VtuberProfileLookup> {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
  const res = await safeFetch(oembedUrl, ALLOWED_HOSTS.youtubeOembed, {
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    next: { revalidate: 3600 },
  } as RequestInit)
  if (!res?.ok) return blank('YouTube', fallbackLink, VTUBER_SUBMIT.lookupFailed)
  const data = await res.json().catch(() => null) as { author_url?: string } | null
  const authorUrl = data?.author_url ? String(data.author_url) : ''
  const parsed = normalizeVtuberProfileLink(authorUrl)
  if (!parsed || parsed.platform !== 'youtube' || parsed.kind === 'video' || parsed.kind === 'custom') {
    return blank('YouTube', fallbackLink, VTUBER_SUBMIT.lookupFailed)
  }
  if (parsed.kind === 'id' && parsed.channelId) {
    return youtubeFromQuery({ kind: 'id', value: parsed.channelId }, fallbackLink)
  }
  if (parsed.kind === 'handle' && parsed.handle) {
    return youtubeFromQuery({ kind: 'handle', value: parsed.handle }, fallbackLink)
  }
  if (parsed.kind === 'user' && parsed.username) {
    return youtubeFromQuery({ kind: 'username', value: parsed.username }, parsed.profileUrl)
  }
  return blank('YouTube', fallbackLink, VTUBER_SUBMIT.lookupFailed)
}

async function twitchFromLogin(login: string, fallbackLink: string): Promise<VtuberProfileLookup> {
  const profile = await withTimeout(helixUserProfile(login), LOOKUP_TIMEOUT_MS)
  if (!profile?.login) return blank('Twitch', fallbackLink, VTUBER_SUBMIT.lookupFailed)
  return fromTwitchProfile(profile)
}

async function lookupParsed(parsed: NormalizedProfileLink): Promise<VtuberProfileLookup> {
  if (parsed.platform === 'twitter') {
    return {
      platform: 'Twitter',
      link: parsed.profileUrl,
      name: null,
      handle: parsed.handle,
      bio: null,
      avatarUrl: null,
      partial: true,
      message: VTUBER_SUBMIT.lookupX,
    }
  }

  if (parsed.platform === 'youtube') {
    if (parsed.kind === 'custom') {
      return blank('YouTube', parsed.profileUrl, VTUBER_SUBMIT.lookupFailed)
    }
    if (parsed.kind === 'video') {
      return youtubeChannelFromVideo(parsed.profileUrl, parsed.profileUrl)
    }
    if (parsed.kind === 'id' && parsed.channelId) {
      return youtubeFromQuery({ kind: 'id', value: parsed.channelId }, parsed.profileUrl)
    }
    if (parsed.kind === 'handle' && parsed.handle) {
      return youtubeFromQuery({ kind: 'handle', value: parsed.handle }, parsed.profileUrl)
    }
    if (parsed.kind === 'user' && parsed.username) {
      return youtubeFromQuery({ kind: 'username', value: parsed.username }, parsed.profileUrl)
    }
    return blank('YouTube', parsed.profileUrl, VTUBER_SUBMIT.lookupFailed)
  }

  // Twitch
  const fallback = parsed.profileUrl || parsed.inputUrl
  if (parsed.kind === 'channel' && parsed.login) {
    return twitchFromLogin(parsed.login, fallback)
  }
  if (parsed.kind === 'clip') {
    let login = parsed.login
    if (parsed.clipId) {
      const details = await withTimeout(helixClipDetails(parsed.clipId), LOOKUP_TIMEOUT_MS)
      if (details?.broadcasterLogin) login = details.broadcasterLogin
    }
    if (login) return twitchFromLogin(login, fallback)
    return blank('Twitch', fallback, VTUBER_SUBMIT.lookupFailed)
  }
  if (parsed.kind === 'video') {
    let login = parsed.login
    if (parsed.videoId) {
      const fromVod = await withTimeout(helixVodBroadcaster(parsed.videoId), LOOKUP_TIMEOUT_MS)
      if (fromVod) login = fromVod
    }
    if (login) return twitchFromLogin(login, fallback)
    return blank('Twitch', fallback, VTUBER_SUBMIT.lookupFailed)
  }
  return blank('Twitch', fallback, VTUBER_SUBMIT.lookupFailed)
}

export async function lookupVtuberProfile(url: string): Promise<VtuberProfileLookup | { error: string; status: 400 }> {
  const parsed = normalizeVtuberProfileLink(url)
  if (!parsed) {
    return { error: VTUBER_SUBMIT.pasteLink, status: 400 }
  }
  return lookupParsed(parsed)
}
