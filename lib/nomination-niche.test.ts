import { describe, expect, it } from 'vitest'
import {
  closeNicheMatches,
  clustersFromTagRows,
  CUSTOM_NICHE_MAX_COUNT,
  matchExistingNiche,
  nicheLeadText,
  nichesFromTagRows,
  safeTagColor,
  sanitizeCustomNiche,
  toNicheSuggestTag,
  validateNominationTags,
} from './nomination-niche'

const TAG_ROWS = [
  { id: 'nclust_darkroom', tag: 'The Darkroom', category: 'niche_cluster', sort_order: 1, description: 'Photography, film, visual arts, photo editing', color: '#7c5c3a' },
  { id: 'nclust_kitchen', tag: 'The Kitchen', category: 'niche_cluster', sort_order: 3, description: 'Cooking, baking, food content, drink reviews', color: '#e8a838' },
  { id: 'nclust_cursed_asmr', tag: 'Cursed ASMR', category: 'niche_cluster', sort_order: 11, description: 'Glitchy, unsettling, liminal-space ASMR — whispers from somewhere wrong', color: '#39ff14' },
  { id: 'clust_chaos', tag: 'Chaos', category: 'cluster', sort_order: 1, description: 'Unhinged gremlin high-energy streamers', color: '#f97316' },
  { id: 'clust_fantasy', tag: 'Fantasy', category: 'other', sort_order: 0, description: 'not a live cluster', color: '#ffffff' },
]

const NICHES = nichesFromTagRows(TAG_ROWS)
const CLUSTERS = clustersFromTagRows(TAG_ROWS)
const CATALOG = { niches: NICHES, clusters: CLUSTERS }

describe('nomination niches', () => {
  it('reads niche options from canonical_tags rows, not clusters', () => {
    expect(NICHES.map(n => n.id)).toEqual(['nclust_darkroom', 'nclust_kitchen', 'nclust_cursed_asmr'])
    expect(NICHES[0].name).toBe('The Darkroom')
    expect(nicheLeadText(NICHES[1])).toBe('Cooking, baking, food content, drink reviews')
    expect(NICHES[2].color).toBe('#39ff14')
    expect(CLUSTERS.map(c => c.id)).toEqual(['clust_chaos'])
    expect(CLUSTERS[0].name).toBe('Chaos')
  })

  it('only accepts a hex color from the database as an accent', () => {
    expect(safeTagColor('#39ff14')).toBe('#39ff14')
    expect(safeTagColor('  #abc  ')).toBe('#abc')
    expect(safeTagColor('red')).toBeNull()
    expect(safeTagColor('url(javascript:alert(1))')).toBeNull()
    expect(safeTagColor(null)).toBeNull()
  })

  it('sanitizes a custom category and caps it at 30 characters', () => {
    expect(sanitizeCustomNiche('  Liminal   radio!!  ')).toBe('Liminal radio')
    expect(sanitizeCustomNiche('<script>alert(1)</script>Night Vale')).toBe('Night Vale')
    expect(sanitizeCustomNiche('abcdefghijklmnopqrstuvwxyzabcdef')).toBe('abcdefghijklmnopqrstuvwxyzabcd')
    expect(sanitizeCustomNiche('x')).toBeNull()
    expect(sanitizeCustomNiche('   ')).toBeNull()
  })

  it('selects an existing niche instead of duplicating it, including The- prefix and case', () => {
    expect(matchExistingNiche('the darkroom', NICHES)?.id).toBe('nclust_darkroom')
    expect(matchExistingNiche('DARKROOM', NICHES)?.id).toBe('nclust_darkroom')
    expect(matchExistingNiche('nclust_kitchen', NICHES)?.id).toBe('nclust_kitchen')
  })

  it('hints at a close existing niche such as Cursed ASMR', () => {
    expect(closeNicheMatches('ASMR', NICHES).map(n => n.name)).toEqual(['Cursed ASMR'])
    expect(closeNicheMatches('Cursed ASMR', NICHES)).toEqual([])
    expect(closeNicheMatches('The Darkroom', NICHES)).toEqual([])
  })

  it('accepts a live niche plus unchanged vibe tags, and stores a new category for review', () => {
    const result = validateNominationTags(
      ['clust_chaos', 'nclust_darkroom', 'wholesome', toNicheSuggestTag('Liminal radio')],
      CATALOG,
    )
    expect(result).toEqual({
      ok: true,
      tags: ['clust_chaos', 'nclust_darkroom', 'wholesome', 'nsuggest:Liminal radio'],
    })
  })

  it('rejects unknown niche ids, near-duplicates, and too many suggestions', () => {
    expect(validateNominationTags(['nclust_cyber'], CATALOG).ok).toBe(false)
    expect(validateNominationTags([toNicheSuggestTag('ASMR')], CATALOG).ok).toBe(false)
    const tooMany = Array.from({ length: CUSTOM_NICHE_MAX_COUNT + 1 }, (_, i) => toNicheSuggestTag(`Genre ${i + 1}`))
    expect(validateNominationTags(tooMany, CATALOG).ok).toBe(false)
  })

  it('turns an exact custom suggestion into the existing niche id', () => {
    expect(validateNominationTags([toNicheSuggestTag('the kitchen')], CATALOG)).toEqual({
      ok: true,
      tags: ['nclust_kitchen'],
    })
  })

  it('allows a nomination with no tags', () => {
    expect(validateNominationTags([], CATALOG)).toEqual({ ok: true, tags: [] })
    expect(validateNominationTags(undefined, CATALOG)).toEqual({ ok: true, tags: [] })
  })

  it('rejects a constellation that is not a live cluster, without treating it as a niche', () => {
    expect(validateNominationTags(['clust_fantasy'], CATALOG).ok).toBe(false)
    expect(validateNominationTags(['clust_chaos'], CATALOG)).toEqual({ ok: true, tags: ['clust_chaos'] })
  })
})
