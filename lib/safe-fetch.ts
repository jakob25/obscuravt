/**
 * Server-side fetch guard against SSRF: only https, only exact allowlisted
 * hostnames, and redirects are never followed (a 3xx just counts as a failure).
 */
export const ALLOWED_HOSTS = {
  twitch: ['clips.twitch.tv', 'www.twitch.tv', 'twitch.tv', 'm.twitch.tv'],
  kick: ['kick.com'],
  rumble: ['rumble.com'],
  youtubeOembed: ['www.youtube.com'],
  youtubeApi: ['www.googleapis.com'],
  twitterOembed: ['publish.twitter.com', 'publish.x.com'],
  // Profile pictures come only from Twitch and YouTube (owner rule).
  avatar: ['static-cdn.jtvnw.net', 'yt3.ggpht.com', 'yt3.googleusercontent.com'],
} as const

export function isAllowedHttpsUrl(url: string, hosts: readonly string[]): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && hosts.includes(u.hostname.toLowerCase()) && !u.username && !u.password && !u.port
  } catch {
    return false
  }
}

export async function safeFetch(url: string, hosts: readonly string[], init: RequestInit = {}): Promise<Response | null> {
  if (!isAllowedHttpsUrl(url, hosts)) return null
  return fetch(url, { ...init, redirect: 'manual' } as RequestInit)
}

/** Follow redirects only when each hop stays on the same host allowlist. */
export async function safeFetchFollow(
  url: string,
  hosts: readonly string[],
  init: RequestInit = {},
  maxRedirects = 4,
): Promise<Response | null> {
  let current = url
  for (let i = 0; i <= maxRedirects; i++) {
    if (!isAllowedHttpsUrl(current, hosts)) return null
    const res = await fetch(current, { ...init, redirect: 'manual' } as RequestInit)
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return null
      try {
        current = new URL(loc, current).toString()
      } catch {
        return null
      }
      continue
    }
    return res
  }
  return null
}
