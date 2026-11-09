import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const db = vi.hoisted(() => ({
  artError: false,
  calls: [] as string[],
  profile: { id: 'existing', name: 'Existing creator', approved: true, platform: 'YouTube', handle: 'existing', link: 'https://youtube.com/@existing', avatar_url: 'https://example.com/avatar.jpg', bio: 'Real field notes from the profile.', tags: [], claimed_by: 'owner' },
}))
vi.mock('@/lib/supabase', () => {
  function from(table: string) {
    db.calls.push(table)
    const result = () => table === 'vtubers' ? { data: db.profile } : table === 'clips' ? { data: [{ id: 'clip', title: 'Existing clip', clip_url: 'https://youtu.be/existing', thumbnail_url: null }] } : table === 'fan_art' ? (db.artError ? { data: null, error: { message: 'Optional table unavailable' } } : { data: [{ id: 'art', image_url: 'https://example.com/art.jpg', twitter_url: 'javascript:alert(1)', submitted_by: 'fan' }] }) : { data: [] }
    const query: Record<string, unknown> = {}
    for (const method of ['select', 'eq', 'in', 'contains', 'order', 'limit', 'ilike']) query[method] = () => query
    query.single = () => Promise.resolve(result())
    query.maybeSingle = () => Promise.resolve(result())
    query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve)
    return query
  }
  return { getSupabaseClient: () => ({ from }), supabaseAdmin: { from } }
})
vi.mock('@/lib/vtuber-channel-link', () => ({ syncTwitchChannelIdentity: async () => null }))
vi.mock('@/lib/vtuber-twitch-hydrate', () => ({ hydrateVtuberById: async () => null }))
vi.mock('@/lib/vtuber-dossier-data', () => ({ fetchDossierSidebarData: async () => ({ nextScheduleLabel: null, lastStreamLabel: null, lastStreamUrl: null, liveNow: false, liveTitle: null, liveUrl: null, activeCmdi: null, openBets: [] }) }))
vi.mock('@/components/vtuber/add-to-circle-button', () => ({ AddToCircleButton: () => <button>Add to Circle</button> }))
vi.mock('@/components/vtuber/claim-profile-button', () => ({ ClaimProfileButton: () => <button>Claim</button> }))
vi.mock('@/components/vtuber/needs-help-contribute', () => ({ NeedsHelpContribute: () => null }))
vi.mock('@/components/vtuber/dossier-clip-submit', () => ({ DossierClipSubmit: () => <button>Submit clip</button> }))
vi.mock('@/components/discovery/silhouette-asset-panel', () => ({ SilhouetteAssetPanel: () => null }))
vi.mock('@/components/common/share-button', () => ({ ShareButton: () => <button>Share</button> }))
vi.mock('@/components/vault/page-back-nav', () => ({ PageBackNav: () => <a href="/discover">Back</a> }))

import VTuberProfilePage from '@/app/vtuber/[id]/page'

beforeEach(() => { db.artError = false; db.calls.length = 0; db.profile.bio = 'Real field notes from the profile.' })

describe('server-composed live dossier', () => {
  it('uses existing profile, clips and art records without inventing world tables or fictional content', async () => {
    const html = renderToStaticMarkup(await VTuberProfilePage({ params: Promise.resolve({ id: 'existing' }) }))
    expect(html).toContain('Existing creator')
    expect(html).toContain('Real field notes from the profile.')
    expect(html).toContain('Existing clip')
    expect(html).toContain('https://example.com/art.jpg')
    expect(html).not.toContain('javascript:')
    // No niche page without real niche content: Profile, Clips and Art only.
    expect(html).not.toContain('No world lore on file.')
    expect(html).not.toContain('-world-panel')
    expect(html).toContain('01 / 03 · Profile')
    expect(html).toContain('/vtuber/existing/fan-corner')
    expect(html).toContain('Submit clip')
    expect(html).not.toContain('Mara Vale')
    expect(html).not.toContain('VERIFIED SUBJECT')
    expect(db.calls).toContain('fan_art')
    expect(db.calls).not.toContain('worlds')
    expect(db.calls).not.toContain('characters')
  })

  it('uses real profile bio for the cover snapshot and an honest empty state when none exists', async () => {
    const html = renderToStaticMarkup(await VTuberProfilePage({ params: Promise.resolve({ id: 'existing' }) }))
    const cover = html.match(/<button[^>]*aria-label="Open dossier[^]*?<\/button>/)?.[0]
    expect(cover).toContain('Subject snapshot')
    expect(cover).toContain('Real field notes from the profile.')
    expect(cover).toContain('FILE ON RECORD')
    db.profile.bio = ''
    const empty = renderToStaticMarkup(await VTuberProfilePage({ params: Promise.resolve({ id: 'existing' }) }))
    expect(empty).toContain('No subject snapshot on file.')
  })

  it('keeps the complete real dossier available when the optional art query fails', async () => {
    db.artError = true
    const html = renderToStaticMarkup(await VTuberProfilePage({ params: Promise.resolve({ id: 'existing' }) }))
    expect(html).toContain('Real field notes from the profile.')
    expect(html).toContain('Art is temporarily unavailable.')
    expect(html).toContain('No schedule on file.')
    expect(html).toContain('No open bets.')
  })
})
