import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VTUBER_SUBMIT } from './site-copy'

const youtubeChannelProfile = vi.fn()
const helixUserProfile = vi.fn()
const helixClipDetails = vi.fn()
const helixVodBroadcaster = vi.fn()
const safeFetch = vi.fn()

vi.mock('./youtube-avatar', () => ({
  youtubeChannelProfile: (...args: unknown[]) => youtubeChannelProfile(...args),
}))

vi.mock('./twitch-helix', () => ({
  helixUserProfile: (...args: unknown[]) => helixUserProfile(...args),
  helixClipDetails: (...args: unknown[]) => helixClipDetails(...args),
  helixVodBroadcaster: (...args: unknown[]) => helixVodBroadcaster(...args),
}))

vi.mock('./safe-fetch', async () => {
  const actual = await vi.importActual<typeof import('./safe-fetch')>('./safe-fetch')
  return {
    ...actual,
    safeFetch: (...args: unknown[]) => safeFetch(...args),
  }
})

import { lookupVtuberProfile } from './vtuber-profile-lookup'

describe('lookupVtuberProfile', () => {
  beforeEach(() => {
    youtubeChannelProfile.mockReset()
    helixUserProfile.mockReset()
    helixClipDetails.mockReset()
    helixVodBroadcaster.mockReset()
    safeFetch.mockReset()
  })

  it('returns a 400 for a URL that is not X, YouTube, or Twitch', async () => {
    await expect(lookupVtuberProfile('https://kick.com/someone')).resolves.toEqual({
      error: VTUBER_SUBMIT.pasteLink,
      status: 400,
    })
  })

  it('fills a Twitch channel from Helix and sanitizes the bio', async () => {
    helixUserProfile.mockResolvedValue({
      login: 'pipuru',
      displayName: 'Pipuru',
      description: 'Hello! Use code PIPURU and stream Monday 7PM EST. Collabs: hi@example.com',
      profileImageUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/pipuru-profile_image-600x600.png',
    })
    const result = await lookupVtuberProfile('https://www.twitch.tv/pipuru/about')
    expect(helixUserProfile).toHaveBeenCalledWith('pipuru')
    expect(result).toMatchObject({
      platform: 'Twitch',
      link: 'https://www.twitch.tv/pipuru',
      name: 'Pipuru',
      handle: 'pipuru',
      avatarUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/pipuru-profile_image-600x600.png',
      partial: false,
      message: null,
    })
    expect((result as { bio: string }).bio).toBe('Hello! and stream. Collabs:')
    expect((result as { bio: string }).bio).not.toMatch(/@|code PIPURU|Monday/)
  })

  it('resolves a clips.twitch.tv clip through Helix, then loads the channel', async () => {
    helixClipDetails.mockResolvedValue({ broadcasterLogin: 'maikyua' })
    helixUserProfile.mockResolvedValue({
      login: 'maikyua',
      displayName: 'maikyua',
      description: 'hi',
      profileImageUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/x-profile_image-600x600.png',
    })
    const result = await lookupVtuberProfile('https://clips.twitch.tv/HappyBloodyEgg')
    expect(helixClipDetails).toHaveBeenCalledWith('HappyBloodyEgg')
    expect(helixUserProfile).toHaveBeenCalledWith('maikyua')
    expect(result).toMatchObject({
      platform: 'Twitch',
      link: 'https://www.twitch.tv/maikyua',
      name: 'maikyua',
      handle: 'maikyua',
      partial: false,
    })
  })

  it('resolves a bare Twitch VOD through Helix, then loads the channel', async () => {
    helixVodBroadcaster.mockResolvedValue('maikyua')
    helixUserProfile.mockResolvedValue({
      login: 'maikyua',
      displayName: 'maikyua',
      description: '',
      profileImageUrl: '',
    })
    const result = await lookupVtuberProfile('https://www.twitch.tv/videos/123456789')
    expect(helixVodBroadcaster).toHaveBeenCalledWith('123456789')
    expect(result).toMatchObject({
      platform: 'Twitch',
      link: 'https://www.twitch.tv/maikyua',
      name: 'maikyua',
    })
  })

  it('keeps a Twitch clip link and leaves fields blank when the channel cannot be found', async () => {
    helixClipDetails.mockResolvedValue(null)
    const result = await lookupVtuberProfile('https://clips.twitch.tv/HappyBloodyEgg')
    expect(helixUserProfile).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      platform: 'Twitch',
      name: null,
      handle: null,
      bio: null,
      avatarUrl: null,
      partial: true,
      message: VTUBER_SUBMIT.lookupFailed,
    })
  })

  it('fills a YouTube @handle from channels.list', async () => {
    youtubeChannelProfile.mockResolvedValue({
      id: 'UC1234567890abcdefghijkl',
      title: 'Pipururu',
      description: 'Songbird and chats.',
      handle: 'Pipururu',
      avatarUrl: 'https://yt3.ggpht.com/abc',
    })
    const result = await lookupVtuberProfile('https://www.youtube.com/@Pipururu')
    expect(youtubeChannelProfile).toHaveBeenCalledWith(
      { kind: 'handle', value: 'Pipururu' },
      expect.objectContaining({ timeoutMs: expect.any(Number) }),
    )
    expect(result).toMatchObject({
      platform: 'YouTube',
      link: 'https://www.youtube.com/@Pipururu',
      name: 'Pipururu',
      handle: 'Pipururu',
      bio: 'Songbird and chats.',
      avatarUrl: 'https://yt3.ggpht.com/abc',
      partial: false,
      message: null,
    })
  })

  it('resolves a YouTube video through oEmbed, then channels.list', async () => {
    safeFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ author_url: 'https://www.youtube.com/@Pipururu' }),
    })
    youtubeChannelProfile.mockResolvedValue({
      id: 'UC1234567890abcdefghijkl',
      title: 'Pipururu',
      description: 'hi',
      handle: 'Pipururu',
      avatarUrl: 'https://yt3.ggpht.com/abc',
    })
    const result = await lookupVtuberProfile('https://youtu.be/abcdefghijk')
    expect(safeFetch).toHaveBeenCalled()
    const oembedUrl = String(safeFetch.mock.calls[0][0])
    expect(oembedUrl).toContain('youtube.com/oembed')
    expect(oembedUrl).toContain('abcdefghijk')
    expect(youtubeChannelProfile).toHaveBeenCalledWith(
      { kind: 'handle', value: 'Pipururu' },
      expect.any(Object),
    )
    expect(result).toMatchObject({
      platform: 'YouTube',
      link: 'https://www.youtube.com/@Pipururu',
      name: 'Pipururu',
    })
  })

  it('keeps a YouTube video link and leaves fields blank when oEmbed cannot find the channel', async () => {
    safeFetch.mockResolvedValue({ ok: false })
    const result = await lookupVtuberProfile('https://www.youtube.com/watch?v=abcdefghijk')
    expect(youtubeChannelProfile).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      platform: 'YouTube',
      link: 'https://www.youtube.com/watch?v=abcdefghijk',
      name: null,
      handle: null,
      bio: null,
      avatarUrl: null,
      partial: true,
      message: VTUBER_SUBMIT.lookupFailed,
    })
  })

  it('saves a YouTube /c/ link and leaves the rest blank without calling search or channels.list', async () => {
    const result = await lookupVtuberProfile('https://www.youtube.com/c/CustomName')
    expect(youtubeChannelProfile).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      platform: 'YouTube',
      link: 'https://www.youtube.com/c/CustomName',
      name: null,
      handle: null,
      bio: null,
      avatarUrl: null,
      partial: true,
      message: VTUBER_SUBMIT.lookupFailed,
    })
  })

  it('saves a /user/ link and leaves the rest blank when forUsername finds nothing', async () => {
    youtubeChannelProfile.mockResolvedValue(null)
    const result = await lookupVtuberProfile('https://www.youtube.com/user/legacyName')
    expect(youtubeChannelProfile).toHaveBeenCalledWith(
      { kind: 'username', value: 'legacyName' },
      expect.any(Object),
    )
    expect(result).toMatchObject({
      platform: 'YouTube',
      link: 'https://www.youtube.com/user/legacyName',
      name: null,
      partial: true,
      message: VTUBER_SUBMIT.lookupFailed,
    })
  })

  it('saves an X profile link and handle only, and does not fetch oEmbed', async () => {
    const result = await lookupVtuberProfile('https://x.com/Obscura_VT/status/1234567890123456789')
    expect(safeFetch).not.toHaveBeenCalled()
    expect(result).toEqual({
      platform: 'Twitter',
      link: 'https://x.com/obscura_vt',
      name: null,
      handle: 'obscura_vt',
      bio: null,
      avatarUrl: null,
      partial: true,
      message: VTUBER_SUBMIT.lookupX,
    })
  })

  it('leaves fields blank when a YouTube or Twitch key/API call fails', async () => {
    youtubeChannelProfile.mockResolvedValue(null)
    helixUserProfile.mockResolvedValue(null)
    await expect(lookupVtuberProfile('https://www.youtube.com/@nope')).resolves.toMatchObject({
      platform: 'YouTube',
      link: 'https://www.youtube.com/@nope',
      name: null,
      partial: true,
      message: VTUBER_SUBMIT.lookupFailed,
    })
    await expect(lookupVtuberProfile('https://www.twitch.tv/nope')).resolves.toMatchObject({
      platform: 'Twitch',
      link: 'https://www.twitch.tv/nope',
      name: null,
      partial: true,
      message: VTUBER_SUBMIT.lookupFailed,
    })
  })
})
