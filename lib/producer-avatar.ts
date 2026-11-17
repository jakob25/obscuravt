import { helixUserProfile } from '@/lib/twitch-helix'
import { youtubeChannelProfile, youtubeTarget } from '@/lib/youtube-avatar'
import { ALLOWED_HOSTS, isAllowedHttpsUrl } from '@/lib/safe-fetch'

/**
 * Producer picture, server-side only, from the producer's own channel through the
 * same official APIs VTuber files use (YouTube Data API, Twitch Helix). Never
 * scraped from VGen/Carrd/X. No key, no channel or a failed call returns null,
 * and the page shows the dossier's letter placeholder.
 */
export async function producerAvatarFromChannels(links: { youtube?: string | null; twitch?: string | null }): Promise<string | null> {
  try {
    if (links.youtube) {
      const target = youtubeTarget({ link: links.youtube, platform: 'YouTube' })
      if (target) {
        const profile = await youtubeChannelProfile(target, { timeoutMs: 5000 })
        const url = profile?.avatarUrl ?? null
        if (url && isAllowedHttpsUrl(url, ALLOWED_HOSTS.avatar)) return url
      }
    }
    if (links.twitch) {
      const profile = await helixUserProfile(links.twitch)
      const url = profile?.profileImageUrl ?? null
      if (url && isAllowedHttpsUrl(url, ALLOWED_HOSTS.avatar)) return url
    }
  } catch {
    // fall through to the placeholder
  }
  return null
}
