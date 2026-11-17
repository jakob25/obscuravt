import { describe, expect, it } from 'vitest'
import { QUESTIONS, decodeOshiAnswers, encodeOshiAnswers } from './oshi-quiz'
import { PAGE_META, oshiMatchBadge } from './site-copy'

describe('oshi quiz share links', () => {
  it('round-trips a full answer set', () => {
    const idx = QUESTIONS.map((q, i) => i % q.options.length)
    const decoded = decodeOshiAnswers(encodeOshiAnswers(idx))
    expect(decoded?.indexes).toEqual(idx)
    expect(decoded?.tags[0]).toEqual(QUESTIONS[0].options[idx[0]].tags)
  })
  it('rejects partial, out-of-range or junk answers', () => {
    expect(decodeOshiAnswers('0,1')).toBeNull()
    expect(decodeOshiAnswers(QUESTIONS.map(() => '99').join(','))).toBeNull()
    expect(decodeOshiAnswers(QUESTIONS.map(() => 'x').join(','))).toBeNull()
    expect(decodeOshiAnswers(null)).toBeNull()
  })
  it('states the real question count in the page description', () => {
    expect(PAGE_META.findMyOshi.description(QUESTIONS.length)).toMatch(new RegExp(`^${QUESTIONS.length} questions\\.`))
  })
  it('labels results as quiz matches, not ranks', () => {
    expect([0, 1, 2].map(oshiMatchBadge)).toEqual(['MATCH 01', 'MATCH 02', 'MATCH 03'])
  })
})
