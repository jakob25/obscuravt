import { describe, expect, it } from 'vitest'
import { cleanMessage, cleanProofLink } from './claim-requests'

describe('claim request input checks', () => {
  it('accepts empty or https proof links only', () => {
    expect(cleanProofLink('')).toEqual({ ok: true, value: null })
    expect(cleanProofLink('https://x.com/a/status/1')).toEqual({ ok: true, value: 'https://x.com/a/status/1' })
    expect(cleanProofLink('http://x.com/a').ok).toBe(false)
    expect(cleanProofLink('not a link').ok).toBe(false)
    expect(cleanProofLink(`https://x.com/${'a'.repeat(400)}`).ok).toBe(false)
  })
  it('limits message length', () => {
    expect(cleanMessage('hi')).toEqual({ ok: true, value: 'hi' })
    expect(cleanMessage('x'.repeat(501)).ok).toBe(false)
  })
})
