import { describe, expect, it } from 'vitest'
import { assignNicheCluster } from './niche-assignment'
import { NICHE_PAGE_BY_CLUSTER, nichePageKindFor } from './dossier-niche-pages'

describe('assignNicheCluster', () => {
  const clusters = [
    { id: 'nclust_a', content_tag_ids: ['cont_x', 'cont_y'] },
    { id: 'nclust_b', content_tag_ids: ['cont_y', 'cont_z', 'cont_w'] },
    { id: 'nclust_c', content_tag_ids: null },
  ]
  it('picks the niche with the most matching content tags', () => {
    expect(assignNicheCluster(['cont_y', 'cont_z'], clusters)).toBe('nclust_b')
  })
  it('keeps the earlier niche on a tie and returns null with no match', () => {
    expect(assignNicheCluster(['cont_y'], clusters)).toBe('nclust_a')
    expect(assignNicheCluster(['vibe_only'], clusters)).toBeNull()
  })
  it('puts a creator in the niche they picked, ahead of content-tag matches', () => {
    expect(assignNicheCluster(['cont_y', 'cont_z', 'nclust_c'], clusters)).toBe('nclust_c')
    expect(assignNicheCluster(['nclust_a'], clusters)).toBe('nclust_a')
  })
  it('falls back to content tags when no niche was picked', () => {
    expect(assignNicheCluster(['clust_chaos', 'wholesome', 'cont_y', 'cont_z'], clusters)).toBe('nclust_b')
  })
  it('ignores a picked niche that is not a live cluster', () => {
    expect(assignNicheCluster(['nclust_retired', 'cont_y', 'cont_z'], clusters)).toBe('nclust_b')
    expect(assignNicheCluster(['nclust_retired'], clusters)).toBeNull()
    expect(assignNicheCluster(['nclust_a'], [])).toBeNull()
  })
})

describe('nichePageKindFor', () => {
  it('gives unlisted, missing or inherited keys no page', () => {
    expect(nichePageKindFor(null)).toBeNull()
    expect(nichePageKindFor('nclust_not_listed')).toBeNull()
    expect(nichePageKindFor('toString')).toBeNull()
  })
  it('only maps to known page kinds', () => {
    for (const kind of Object.values(NICHE_PAGE_BY_CLUSTER)) expect(['world', 'pictures']).toContain(kind)
  })
})
