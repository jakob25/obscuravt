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
