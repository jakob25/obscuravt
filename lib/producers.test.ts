import { describe, expect, it } from 'vitest'
import {
  filterProducers,
  genreTagCounts,
  isProducerId,
  makeProducerId,
  parseCreditInput,
  parseProducerInput,
  producerAvatar,
  producerLinks,
  producerServices,
  youtubeEmbedId,
  SHOW_SOUNDCLOUD,
  SHOW_BLUESKY,
  adminLinkKeys,
  producerPortfolio,
} from './producers'
import { PRODUCERS } from './site-copy'

describe('producer ids', () => {
  it('follow the vt_ id style with a pr_ prefix', () => {
    expect(makeProducerId('Neon Kitsune!', 'a1b2c3')).toBe('pr_neonkitsune_a1b2c3')
    expect(isProducerId(makeProducerId('Some Very Long Producer Name Here'))).toBe(true)
    expect(makeProducerId('ボカロ', 'abcdef')).toBe('pr_producer_abcdef')
    expect(isProducerId('vt_someone_abc123')).toBe(false)
    expect(isProducerId("pr_x_abc123' or 1=1")).toBe(false)
  })
})

describe('parseProducerInput', () => {
  it('keeps real fields, drops unknown keys, and stores no price or status', () => {
    const r = parseProducerInput({
      name: '  Neon <b>Kitsune</b> ',
      bio: 'Makes cozy BGM.',
      genre_tags: ['Lo-Fi', '#cozy', 'lo-fi', ''],
      services: ['stream_bgm', 'original_songs'],
      commission_url: 'https://vgen.co/neon',
      youtube: '',
      soundcloud: 'https://soundcloud.com/neon',
      price: '$50',
      commissions_open: true,
    }, 'abcdef')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.name).toBe('Neon Kitsune')
    expect(r.value.genre_tags).toEqual(['lo-fi', 'cozy'])
    expect(r.value.services).toEqual(['stream_bgm', 'original_songs'])
    expect(r.value.youtube).toBeNull()
    expect(r.value.avatar_url).toBeNull()
    expect(Object.keys(r.value)).not.toContain('price')
    expect(Object.keys(r.value)).not.toContain('commissions_open')
  })

  it('rejects a missing name, unknown services and non-https links', () => {
    expect(parseProducerInput({ name: ' ' })).toEqual({ ok: false, error: 'Name is required.' })
    expect(parseProducerInput({ name: 'A', services: ['tarot'] }).ok).toBe(false)
    expect(parseProducerInput({ name: 'A', x: 'javascript:alert(1)' }).ok).toBe(false)
    expect(parseProducerInput({ name: 'A', commission_url: 'http://vgen.co/a' }).ok).toBe(false)
  })
})

describe('parseCreditInput', () => {
  const base = { producer_id: 'pr_neon_abcdef', vtuber_id: 'vt_pipuru_123456', song_title: 'Starfall', song_url: 'https://youtu.be/dQw4w9WgXcQ', role: 'produced' }
  it('requires a public https source link and a known role', () => {
    expect(parseCreditInput(base)).toEqual({ ok: true, value: base })
    expect(parseCreditInput({ ...base, song_url: '' }).ok).toBe(false)
    expect(parseCreditInput({ ...base, song_url: 'ftp://x' }).ok).toBe(false)
    expect(parseCreditInput({ ...base, role: 'manager' }).ok).toBe(false)
    expect(parseCreditInput({ ...base, producer_id: 'nope' }).ok).toBe(false)
    expect(parseCreditInput({ ...base, vtuber_id: '' }).ok).toBe(false)
  })
})

describe('display helpers', () => {
  it('only uses Twitch/YouTube CDN pictures, else the placeholder', () => {
    expect(producerAvatar({ avatar_url: 'https://yt3.ggpht.com/abc' })).toBe('https://yt3.ggpht.com/abc')
    expect(producerAvatar({ avatar_url: 'https://static-cdn.jtvnw.net/x.png' })).toBe('https://static-cdn.jtvnw.net/x.png')
    expect(producerAvatar({ avatar_url: 'https://vgen.co/pic.png' })).toBeNull()
    expect(producerAvatar({ avatar_url: 'https://pbs.twimg.com/a.jpg' })).toBeNull()
    expect(producerAvatar({ avatar_url: null })).toBeNull()
  })

  it('lists valid links in order and skips missing or bad ones', () => {
    const row = { soundcloud: 'https://soundcloud.com/a', youtube: 'https://youtube.com/@a', x: 'javascript:1', twitch: null }
    expect(producerLinks(row, { showSoundcloud: true }))
      .toEqual([{ key: 'youtube', url: 'https://youtube.com/@a' }, { key: 'soundcloud', url: 'https://soundcloud.com/a' }])
  })

  it('hides SoundCloud while SHOW_SOUNDCLOUD is off, but still stores it from the admin form', () => {
    expect(SHOW_SOUNDCLOUD).toBe(false)
    expect(producerLinks({ soundcloud: 'https://soundcloud.com/a', youtube: 'https://youtube.com/@a' }))
      .toEqual([{ key: 'youtube', url: 'https://youtube.com/@a' }])
    const r = parseProducerInput({ name: 'A', soundcloud: 'https://soundcloud.com/a' }, 'abcdef')
    expect(r.ok && r.value.soundcloud).toBe('https://soundcloud.com/a')
    expect(PRODUCERS.links.soundcloud).toBe('SoundCloud')
  })

  it('hides Bluesky the same way, and keeps both out of the admin form', () => {
    expect(SHOW_BLUESKY).toBe(false)
    expect(producerLinks({ bluesky: 'https://bsky.app/profile/a', x: 'https://x.com/a' }))
      .toEqual([{ key: 'x', url: 'https://x.com/a' }])
    expect(producerLinks({ bluesky: 'https://bsky.app/profile/a' }, { showBluesky: true }))
      .toEqual([{ key: 'bluesky', url: 'https://bsky.app/profile/a' }])
    expect(adminLinkKeys()).toEqual(['youtube', 'twitch', 'x'])
    expect(adminLinkKeys({ showSoundcloud: true, showBluesky: true })).toEqual(['youtube', 'twitch', 'x', 'bluesky', 'soundcloud'])
  })

  it('does not sneak a hidden network in through the portfolio or another link column', () => {
    expect(producerPortfolio({ portfolio_url: 'https://soundcloud.com/a/sets/demo' })).toBeNull()
    expect(producerPortfolio({ portfolio_url: 'https://www.bsky.app/profile/a' })).toBeNull()
    expect(producerPortfolio({ portfolio_url: 'https://www.youtube.com/playlist?list=PL1' })).toBe('https://www.youtube.com/playlist?list=PL1')
    expect(producerPortfolio({ portfolio_url: 'https://soundcloud.com/a' }, { showSoundcloud: true })).toBe('https://soundcloud.com/a')
    expect(producerLinks({ x: 'https://soundcloud.com/a' })).toEqual([])
  })

  it('keeps only known services in fixed order, each with a label', () => {
    expect(producerServices({ services: ['jingles_alerts', 'bogus', 'original_songs'] })).toEqual(['original_songs', 'jingles_alerts'])
    for (const s of producerServices({ services: ['original_songs', 'stream_bgm', 'covers_instrumentals', 'mixing_mastering', 'jingles_alerts'] })) {
      expect(PRODUCERS.services[s]).toBeTruthy()
    }
  })

  it('embeds YouTube only', () => {
    expect(youtubeEmbedId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeEmbedId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeEmbedId('https://soundcloud.com/a/song')).toBeNull()
    expect(youtubeEmbedId('https://open.spotify.com/track/abc')).toBeNull()
    expect(youtubeEmbedId('not a url')).toBeNull()
  })

  it('filters by genre tag and service and counts tags', () => {
    const rows = [
      { id: 'a', genre_tags: ['lo-fi', 'cozy'], services: ['stream_bgm'] },
      { id: 'b', genre_tags: ['j-pop'], services: ['original_songs', 'stream_bgm'] },
      { id: 'c', genre_tags: null, services: null },
    ]
    expect(filterProducers(rows, {}).map(r => r.id)).toEqual(['a', 'b', 'c'])
    expect(filterProducers(rows, { tag: 'LO-FI' }).map(r => r.id)).toEqual(['a'])
    expect(filterProducers(rows, { service: 'stream_bgm' }).map(r => r.id)).toEqual(['a', 'b'])
    expect(filterProducers(rows, { tag: 'j-pop', service: 'stream_bgm' }).map(r => r.id)).toEqual(['b'])
    expect(filterProducers(rows, { service: 'not_a_service' }).map(r => r.id)).toEqual(['a', 'b', 'c'])
    expect(genreTagCounts(rows)).toEqual([{ tag: 'cozy', count: 1 }, { tag: 'j-pop', count: 1 }, { tag: 'lo-fi', count: 1 }])
  })
})

describe('producer copy', () => {
  it('uses the CMO strings and makes no price, status or rights claims', () => {
    expect(PRODUCERS.stamp).toBe('PRODUCER FILE')
    expect(PRODUCERS.section).toBe('The Booth')
    expect(PRODUCERS.soundProfile).toBe('SOUND PROFILE')
    expect(PRODUCERS.servicesOnRecord).toBe('SERVICES ON RECORD')
    expect(PRODUCERS.creditsOnRecord).toBe('CREDITS ON RECORD')
    expect(PRODUCERS.commission).toBe('OPEN COMMISSION PAGE')
    expect(PRODUCERS.noCredits).toBe('No public credits on record yet.')
    const all = JSON.stringify(PRODUCERS).toLowerCase()
    for (const word of ['price', '$', 'commissions open', 'closed', 'royalty', 'license', 'rights']) {
      expect(all).not.toContain(word)
    }
  })
})
