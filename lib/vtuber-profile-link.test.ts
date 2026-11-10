import { describe, expect, it } from 'vitest'
import { normalizeVtuberProfileLink } from './vtuber-profile-link'

describe('normalizeVtuberProfileLink', () => {
  it('normalizes Twitch channel URLs, including about and videos suffixes', () => {
    for (const input of [
      'https://www.twitch.tv/maikyua',
      'https://twitch.tv/Maikyua/about',
      'http://m.twitch.tv/maikyua/videos',
      'twitch.tv/maikyua?lang=en',
    ]) {
      expect(normalizeVtuberProfileLink(input)).toMatchObject({
        platform: 'twitch',
        kind: 'channel',
        profileUrl: 'https://www.twitch.tv/maikyua',
        login: 'maikyua',
      })
    }
  })

  it('classifies Twitch clips and VODs, keeping a channel login when the path has one', () => {
    expect(normalizeVtuberProfileLink('https://www.twitch.tv/maikyua/clip/HappyBloodyEgg')).toMatchObject({
      platform: 'twitch',
      kind: 'clip',
      profileUrl: 'https://www.twitch.tv/maikyua',
      login: 'maikyua',
      clipId: 'HappyBloodyEgg',
    })
    expect(normalizeVtuberProfileLink('https://clips.twitch.tv/HappyBloodyEgg')).toMatchObject({
      platform: 'twitch',
      kind: 'clip',
      profileUrl: null,
      login: null,
      clipId: 'HappyBloodyEgg',
    })
    expect(normalizeVtuberProfileLink('https://www.twitch.tv/videos/123456789')).toMatchObject({
      platform: 'twitch',
      kind: 'video',
      login: null,
      videoId: '123456789',
    })
    expect(normalizeVtuberProfileLink('https://www.twitch.tv/maikyua/video/123456789')).toMatchObject({
      platform: 'twitch',
      kind: 'video',
      profileUrl: 'https://www.twitch.tv/maikyua',
      login: 'maikyua',
      videoId: '123456789',
    })
  })

  it('normalizes YouTube handles, channel ids, /user/, and /c/ links', () => {
    expect(normalizeVtuberProfileLink('https://www.youtube.com/@Pipururu/about')).toMatchObject({
      platform: 'youtube',
      kind: 'handle',
      profileUrl: 'https://www.youtube.com/@Pipururu',
      handle: 'Pipururu',
    })
    expect(normalizeVtuberProfileLink('https://youtube.com/channel/UC1234567890abcdefghijkl')).toMatchObject({
      platform: 'youtube',
      kind: 'id',
      profileUrl: 'https://www.youtube.com/channel/UC1234567890abcdefghijkl',
      channelId: 'UC1234567890abcdefghijkl',
    })
    expect(normalizeVtuberProfileLink('https://www.youtube.com/user/legacyName/videos')).toMatchObject({
      platform: 'youtube',
      kind: 'user',
      profileUrl: 'https://www.youtube.com/user/legacyName',
      username: 'legacyName',
    })
    expect(normalizeVtuberProfileLink('https://www.youtube.com/c/CustomName')).toMatchObject({
      platform: 'youtube',
      kind: 'custom',
      profileUrl: 'https://www.youtube.com/c/CustomName',
      customName: 'CustomName',
      handle: null,
      channelId: null,
    })
  })

  it('classifies YouTube videos, including youtu.be and shorts', () => {
    for (const input of [
      'https://www.youtube.com/watch?v=abcdefghijk',
      'https://youtu.be/abcdefghijk',
      'https://www.youtube.com/shorts/abcdefghijk',
      'https://www.youtube.com/embed/abcdefghijk',
    ]) {
      expect(normalizeVtuberProfileLink(input)).toMatchObject({
        platform: 'youtube',
        kind: 'video',
        profileUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
        videoId: 'abcdefghijk',
      })
    }
  })

  it('takes an X/Twitter handle from a profile or post path and stores the profile link', () => {
    expect(normalizeVtuberProfileLink('https://x.com/Obscura_VT')).toMatchObject({
      platform: 'twitter',
      kind: 'profile',
      profileUrl: 'https://x.com/obscura_vt',
      handle: 'obscura_vt',
    })
    expect(normalizeVtuberProfileLink('https://twitter.com/Obscura_VT/status/1234567890123456789?s=20')).toMatchObject({
      platform: 'twitter',
      kind: 'profile',
      profileUrl: 'https://x.com/obscura_vt',
      handle: 'obscura_vt',
    })
    expect(normalizeVtuberProfileLink('https://x.com/@obscura_vt/with_replies')).toMatchObject({
      profileUrl: 'https://x.com/obscura_vt',
      handle: 'obscura_vt',
    })
  })

  it('returns null for reserved paths, non-profile junk, and other sites', () => {
    const rejected = [
      '',
      'not a url',
      'https://example.com/foo',
      'https://x.com/home',
      'https://x.com/i/web/status/123',
      'https://x.com/this_handle_is_too_long',
      'https://twitch.tv/videos',
      'https://twitch.tv/directory/game/Art',
      'https://www.youtube.com/results?search_query=vtuber',
      'https://www.youtube.com/watch',
      'javascript:alert(1)',
      'https://user:pass@twitch.tv/maikyua',
      'https://kick.com/someone',
    ]
    for (const input of rejected) {
      expect(normalizeVtuberProfileLink(input)).toBeNull()
    }
  })
})
