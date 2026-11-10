import { beforeEach, describe, expect, it, vi } from 'vitest'
import { assignNicheCluster } from '@/lib/niche-assignment'
import { buildNominationTags, validateNominationTags } from '@/lib/nomination-niche'
import { scoreVTubers } from '@/lib/oshi-score'

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({ from: vi.fn() }),
  supabase: { from: vi.fn() },
}))

import { dbVTuberToType } from '@/hooks/use-data'
import { getVTubersByConstellationLive, rowToVTuber } from '@/hooks/use-star-map-data'

const CATALOG = {
  niches: [{ id: 'nclust_darkroom', name: 'The Darkroom', description: null, color: null }],
  clusters: [{ id: 'clust_chaos', name: 'Chaos', description: null, color: null }],
}

const NICHE_CLUSTERS = [
  { id: 'nclust_darkroom', content_tag_ids: ['cont_photo'] },
  { id: 'nclust_arcade', content_tag_ids: ['cont_arcade', 'cont_games'] },
]

function dbRow(tags: string[]) {
  return {
    id: 'vt_pipuru',
    name: 'Pipuru',
    handle: 'pipuru',
    platform: 'Twitch',
    link: 'https://www.twitch.tv/pipuru',
    bio: 'Songbird and chats.',
    tags,
    approved: true,
    spotlight: false,
    avatar_url: null,
  }
}

describe('nomination picks through approval and both maps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stores the form\'s niche and constellation ids on the nomination tags', () => {
    const tags = buildNominationTags({
      constellationId: 'clust_chaos',
      nicheId: 'nclust_darkroom',
      vibeTags: ['wholesome'],
    })
    expect(tags).toEqual(['clust_chaos', 'nclust_darkroom', 'wholesome'])
    expect(validateNominationTags(tags, CATALOG)).toEqual({ ok: true, tags })
  })

  it('places a picked constellation on the star map, constellation pages, and Find My Oshi', () => {
    const approvedTags = ['clust_chaos', 'nclust_darkroom', 'wholesome']
    const fromStarMap = rowToVTuber(dbRow(approvedTags))
    const fromOshiFeed = dbVTuberToType(dbRow(approvedTags))

    expect(fromStarMap.category).toBe('clust_chaos')
    expect(fromOshiFeed.category).toBe('clust_chaos')
    expect(getVTubersByConstellationLive([fromStarMap], 'clust_chaos').map(v => v.id)).toEqual(['vt_pipuru'])
    expect(getVTubersByConstellationLive([fromStarMap], 'clust_comfy')).toEqual([])

    const matches = scoreVTubers(
      [['clust_chaos', 'vibe_chaotic'], ['clust_comfy', 'vibe_chill']],
      [fromOshiFeed, dbVTuberToType({ ...dbRow(['clust_comfy']), id: 'vt_other' })],
    )
    expect(matches[0].id).toBe('vt_pipuru')
    expect(matches[1].id).toBe('vt_other')
  })

  it('defaults a skipped constellation to Variety, and still honors a later pick', () => {
    const skipped = rowToVTuber(dbRow(['nclust_darkroom']))
    expect(skipped.category).toBe('clust_variety')
    expect(getVTubersByConstellationLive([skipped], 'clust_variety').map(v => v.id)).toEqual(['vt_pipuru'])
    expect(dbVTuberToType(dbRow(['nclust_darkroom'])).category).toBe('clust_variety')
  })

  it('places a picked niche on the Niche Map ahead of content-tag fallback', () => {
    expect(assignNicheCluster(['nclust_darkroom', 'cont_arcade', 'cont_games'], NICHE_CLUSTERS)).toBe('nclust_darkroom')
    expect(assignNicheCluster(['cont_arcade', 'cont_games'], NICHE_CLUSTERS)).toBe('nclust_arcade')
  })
})
