import { describe, expect, it } from 'vitest'
import { formatTagLabel } from './tag-label'

describe('formatTagLabel', () => {
  it('turns constellation ids into a readable phrase', () => {
    expect(formatTagLabel('clust_slice_of_life')).toBe('Slice of life')
    expect(formatTagLabel('clust_chaos')).toBe('Chaos')
    expect(formatTagLabel('clust_cyber')).toBe('Cyber')
    expect(formatTagLabel('clust_fantasy')).toBe('Fantasy')
    expect(formatTagLabel('clust_music')).toBe('Music')
  })

  it('title-cases a plain vibe tag without changing its meaning', () => {
    expect(formatTagLabel('wholesome')).toBe('Wholesome')
    expect(formatTagLabel('vibe_slice_of_life')).toBe('Slice of life')
  })

  it('leaves the original string alone when nothing remains after a prefix', () => {
    expect(formatTagLabel('clust_')).toBe('clust_')
    expect(formatTagLabel('')).toBe('')
  })
})
