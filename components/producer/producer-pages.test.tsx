import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const db = vi.hoisted(() => ({
  producers: [] as Record<string, unknown>[],
  credits: [] as Record<string, unknown>[],
  vtubers: [{ id: 'vt_pipuru_123456', name: 'Pipuru' }] as Record<string, unknown>[],
}))

vi.mock('@/lib/supabase', () => {
  function from(table: string) {
    const rows = () => (table === 'producers' ? db.producers : table === 'producer_credits' ? db.credits : table === 'vtubers' ? db.vtubers : [])
    let filters: [string, unknown][] = []
    const apply = () => rows().filter(r => filters.every(([k, v]) => (Array.isArray(v) ? v.includes(r[k]) : k === 'approved' ? true : r[k] === v)))
    const q: Record<string, unknown> = {}
    q.select = () => q
    q.eq = (k: string, v: unknown) => { filters.push([k, v]); return q }
    q.in = (k: string, v: unknown[]) => { filters.push([k, v]); return q }
    for (const m of ['order', 'limit']) q[m] = () => q
    q.maybeSingle = () => Promise.resolve({ data: apply()[0] ?? null, error: null })
    q.then = (resolve: (v: unknown) => unknown) => { const data = apply(); filters = []; return Promise.resolve({ data, error: null, count: data.length }).then(resolve) }
    return q
  }
  return { getSupabaseClient: () => ({ from }), supabaseAdmin: { from } }
})
vi.mock('@/components/common/share-button', () => ({ ShareButton: () => <button>Share</button> }))
vi.mock('@/components/vault/page-back-nav', () => ({ PageBackNav: () => <a href="/producers">Back</a> }))
vi.mock('@/components/vault/page-header', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND') } }))

import ProducersPage from '@/app/producers/page'
import ProducerPage from '@/app/producer/[id]/page'

const neon = { id: 'pr_neon_abcdef', name: 'Neon', bio: 'Cozy loops.', avatar_url: null, genre_tags: ['lo-fi'], services: ['stream_bgm'], commission_url: null, portfolio_url: null, youtube: null, twitch: null, x: null, soundcloud: null, bluesky: null }
const kai = { ...neon, id: 'pr_kai_abcdef', name: 'Kai', genre_tags: ['j-pop'], services: ['original_songs'] }

beforeEach(() => { db.producers = []; db.credits = [] })

describe('The Booth directory', () => {
  it('has a clean empty state with zero producers', async () => {
    const html = renderToStaticMarkup(await ProducersPage({ searchParams: Promise.resolve({}) }))
    expect(html).toContain('The Booth')
    expect(html).toContain('No producers on file yet.')
    expect(html).not.toContain('aria-label="Filters"')
  })

  it('filters by sound and by service', async () => {
    db.producers = [neon, kai]
    const all = renderToStaticMarkup(await ProducersPage({ searchParams: Promise.resolve({}) }))
    expect(all).toContain('/producer/pr_neon_abcdef')
    expect(all).toContain('/producer/pr_kai_abcdef')
    const lofi = renderToStaticMarkup(await ProducersPage({ searchParams: Promise.resolve({ tag: 'lo-fi' }) }))
    expect(lofi).toContain('/producer/pr_neon_abcdef')
    expect(lofi).not.toContain('/producer/pr_kai_abcdef')
    const songs = renderToStaticMarkup(await ProducersPage({ searchParams: Promise.resolve({ service: 'original_songs' }) }))
    expect(songs).toContain('/producer/pr_kai_abcdef')
    expect(songs).not.toContain('/producer/pr_neon_abcdef')
    // No credits yet: no "0 credits" line.
    expect(all).not.toContain('0 credits')
    expect(all).not.toMatch(/\d+ credits?</)
    const none = renderToStaticMarkup(await ProducersPage({ searchParams: Promise.resolve({ tag: 'metal' }) }))
    expect(none).toContain('No producers match that filter.')
  })
})

describe('/producer/[id]', () => {
  it('renders a producer file with credits linked to approved VTuber files only', async () => {
    db.producers = [neon]
    db.credits = [
      { id: 'c1', producer_id: neon.id, vtuber_id: 'vt_pipuru_123456', song_title: 'Starfall', song_url: 'https://soundcloud.com/x/starfall', role: 'produced' },
      { id: 'c2', producer_id: neon.id, vtuber_id: 'vt_gone_000000', song_title: 'Hidden', song_url: 'https://soundcloud.com/x/hidden', role: 'mixed' },
    ]
    const html = renderToStaticMarkup(await ProducerPage({ params: Promise.resolve({ id: neon.id }) }))
    expect(html).toContain('PRODUCER FILE')
    expect(html).toContain('href="/vtuber/vt_pipuru_123456"')
    expect(html).toContain('Starfall')
    expect(html).not.toContain('Hidden')
  })

  it('404s for unknown or malformed ids without querying', async () => {
    await expect(ProducerPage({ params: Promise.resolve({ id: 'vt_pipuru_123456' }) })).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(ProducerPage({ params: Promise.resolve({ id: 'pr_nobody_abcdef' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  })
})

describe('directory credit count', () => {
  it('shows the count only from 1 credit up', async () => {
    db.producers = [neon, kai]
    db.credits = [
      { id: 'c1', producer_id: neon.id, vtuber_id: 'vt_pipuru_123456', song_title: 'A', song_url: 'https://youtu.be/dQw4w9WgXcQ', role: 'produced' },
      { id: 'c2', producer_id: neon.id, vtuber_id: 'vt_pipuru_123456', song_title: 'B', song_url: 'https://youtu.be/dQw4w9WgXcR', role: 'mixed' },
    ]
    const html = renderToStaticMarkup(await ProducersPage({ searchParams: Promise.resolve({}) }))
    expect(html).toContain('2 credits')
    expect(html).not.toContain('0 credits')
    db.credits = db.credits.slice(0, 1)
    expect(renderToStaticMarkup(await ProducersPage({ searchParams: Promise.resolve({}) }))).toContain('1 credit<')
  })
})
