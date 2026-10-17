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
  twitterOembed: ['publish.twitter.com'],
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
