import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ProducerRow } from '@/lib/producers'

vi.mock('@/components/common/share-button', () => ({ ShareButton: ({ label }: { label: string }) => <button>{label}</button> }))

import { ProducerFile } from './producer-file'
import { MusicByLine } from './music-by-line'

const bare: ProducerRow = {
  id: 'pr_neon_abcdef', name: 'Neon', bio: null, avatar_url: null, genre_tags: [], services: [],
  commission_url: null, portfolio_url: null, youtube: null, twitch: null, x: null, soundcloud: null, bluesky: null,
}

describe('ProducerFile', () => {
  it('reads well with nothing but a name: placeholder picture, honest empty lines, no commission button', () => {
    const html = renderToStaticMarkup(<ProducerFile producer={bare} credits={[]} />)
    expect(html).toContain('PRODUCER FILE')
    expect(html).toContain('Neon')
    expect(html).toContain('case-polaroid-fallback')
    expect(html).toContain('No public credits on record yet.')
    expect(html).toContain('No sound profile on file.')
    expect(html).not.toContain('OPEN COMMISSION PAGE')
    expect(html).not.toContain('<iframe')
    expect(html).not.toMatch(/\$\d|price|commissions open/i)
  })

  it('shows real links, tags, services and credits; embeds YouTube only; never uses a non-allowlisted picture', () => {
    const html = renderToStaticMarkup(
      <ProducerFile
        producer={{
          ...bare,
          avatar_url: 'https://vgen.co/pic.png',
          bio: 'Cozy loops.',
          genre_tags: ['lo-fi', 'cozy'],
          services: ['stream_bgm', 'mixing_mastering'],
          commission_url: 'https://vgen.co/neon',
          portfolio_url: 'https://www.youtube.com/playlist?list=PL1',
          soundcloud: 'https://soundcloud.com/neon',
          bluesky: 'https://bsky.app/profile/neon',
          x: 'javascript:alert(1)',
        }}
        credits={[
          { id: 'c1', vtuber_id: 'vt_pipuru_123456', vtuber_name: 'Pipuru', song_title: 'Starfall', song_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', role: 'composed' },
          { id: 'c2', vtuber_id: 'vt_mochi_654321', vtuber_name: 'Mochi', song_title: 'Rainy BGM', song_url: 'https://soundcloud.com/neon/rainy', role: 'bgm' },
        ]}
      />,
    )
    expect(html).not.toContain('vgen.co/pic.png')
    expect(html).toContain('href="https://vgen.co/neon"')
    expect(html).toContain('OPEN COMMISSION PAGE')
    expect(html).toContain('SOUND PROFILE')
    expect(html).toContain('href="/producers?tag=lo-fi"')
    expect(html).toContain('Stream BGM')
    expect(html).toContain('Mixing &amp; mastering')
    // SoundCloud is stored but hidden while SHOW_SOUNDCLOUD is off.
    expect(html).not.toContain('href="https://soundcloud.com/neon"')
    expect(html).not.toContain('SoundCloud')
    expect(html).not.toContain('bsky.app')
    expect(html).not.toContain('Bluesky')
    expect(html).not.toContain('javascript:')
    expect(html).toMatch(/Composed for <a [^>]*href="\/vtuber\/vt_pipuru_123456"[^>]*>Pipuru<\/a>, <span[^>]*>Starfall<\/span>/)
    expect(html).toContain('href="https://soundcloud.com/neon/rainy"')
    expect((html.match(/<iframe/g) ?? []).length).toBe(1)
    expect(html).toContain('src="https://www.youtube.com/embed/dQw4w9WgXcQ')
  })
})

describe('MusicByLine', () => {
  it('renders nothing without credits or a door', () => {
    expect(renderToStaticMarkup(<MusicByLine producers={[]} />)).toBe('')
  })
  it('links each credited producer, and The Booth door when asked', () => {
    const html = renderToStaticMarkup(<MusicByLine producers={[{ id: 'pr_a_abcdef', name: 'A' }, { id: 'pr_b_abcdef', name: 'B' }]} studioDoor />)
    expect(html).toContain('Music by')
    expect(html).toContain('href="/producer/pr_a_abcdef"')
    expect(html).toContain('href="/producer/pr_b_abcdef"')
    expect(html).toContain('href="/producers"')
  })
})
