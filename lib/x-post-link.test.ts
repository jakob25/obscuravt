import { describe, expect, it } from 'vitest'
import { normalizeXPostLink, X_POST_URL_CHECK } from './x-post-link'

const CANONICAL = 'https://x.com/obscura_vt/status/1234567890123456789'

function expectCanonical(input: string, expected = CANONICAL) {
  const result = normalizeXPostLink(input)
  expect(result).toBe(expected)
  expect(result && X_POST_URL_CHECK.test(result)).toBe(true)
}

describe('normalizeXPostLink', () => {
  it('returns a canonical https://x.com/<handle>/status/<id> URL', () => {
    expectCanonical('https://x.com/obscura_vt/status/1234567890123456789')
    expectCanonical('https://twitter.com/obscura_vt/status/1234567890123456789')
  })

  it('accepts www. and mobile. prefixes, m. hosts, and http', () => {
    expectCanonical('https://www.x.com/obscura_vt/status/1234567890123456789')
    expectCanonical('https://www.twitter.com/obscura_vt/status/1234567890123456789')
    expectCanonical('https://mobile.x.com/obscura_vt/status/1234567890123456789')
    expectCanonical('https://mobile.twitter.com/obscura_vt/status/1234567890123456789')
    expectCanonical('https://m.x.com/obscura_vt/status/1234567890123456789')
    expectCanonical('https://m.twitter.com/obscura_vt/status/1234567890123456789')
    expectCanonical('http://x.com/obscura_vt/status/1234567890123456789')
    expectCanonical('http://www.twitter.com/obscura_vt/status/1234567890123456789')
  })

  it('strips query strings, fragments, trailing slashes, and /photo/1 suffixes', () => {
    expectCanonical('https://x.com/obscura_vt/status/1234567890123456789?s=20')
    expectCanonical('https://x.com/obscura_vt/status/1234567890123456789?s=20&t=abcDEF')
    expectCanonical('https://twitter.com/obscura_vt/status/1234567890123456789?ref_src=twsrc%5Etfw')
    expectCanonical('https://x.com/obscura_vt/status/1234567890123456789#')
    expectCanonical('https://x.com/obscura_vt/status/1234567890123456789#photo')
    expectCanonical('https://x.com/obscura_vt/status/1234567890123456789/')
    expectCanonical('https://x.com/obscura_vt/status/1234567890123456789/photo/1')
    expectCanonical('https://x.com/obscura_vt/status/1234567890123456789/photo/1?s=20')
    expectCanonical('https://x.com/obscura_vt/status/1234567890123456789/photo/2#x')
    expectCanonical('https://x.com/obscura_vt/status/1234567890123456789/video/1')
    expectCanonical('https://x.com/obscura_vt/status/1234567890123456789/analytics')
  })

  it('accepts protocol-relative and bare-host links, and trims surrounding space', () => {
    expectCanonical('  https://x.com/obscura_vt/status/1234567890123456789  ')
    expectCanonical('//x.com/obscura_vt/status/1234567890123456789')
    expectCanonical('x.com/obscura_vt/status/1234567890123456789?s=20')
    expectCanonical('twitter.com/obscura_vt/status/1234567890123456789/')
    expectCanonical('mobile.twitter.com/obscura_vt/status/1234567890123456789/photo/1')
  })

  it('lowercases the handle and strips a leading @', () => {
    expectCanonical('https://X.COM/Obscura_VT/status/1234567890123456789')
    expectCanonical('https://x.com/@obscura_vt/status/1234567890123456789')
  })

  it('accepts internal /i/web/status and /i/status permalinks', () => {
    expectCanonical('https://twitter.com/i/web/status/1234567890123456789', 'https://x.com/i/status/1234567890123456789')
    expectCanonical('https://x.com/i/status/1234567890123456789?s=20', 'https://x.com/i/status/1234567890123456789')
  })

  it('returns null for anything that is not a single post link', () => {
    const rejected = [
      '',
      '   ',
      null,
      undefined,
      'not a url',
      'https://example.com/obscura_vt/status/1234567890123456789',
      'https://evilx.com/obscura_vt/status/1234567890123456789',
      'https://twitter.com.evil.com/obscura_vt/status/1234567890123456789',
      'https://x.com/obscura_vt',
      'https://x.com/obscura_vt/with_replies',
      'https://x.com/home',
      'https://x.com/explore',
      'https://x.com/search?q=hello',
      'https://x.com/intent/tweet?text=hello',
      'https://x.com/i/flow/login',
      'https://x.com/obscura_vt/status/',
      'https://x.com/obscura_vt/statuses/1234567890123456789',
      'https://x.com/obscura_vt/status/abc',
      'https://x.com/obscura_vt/status/123abc',
      'https://x.com/this_handle_is_too_long/status/1234567890123456789',
      'https://x.com/has-dash/status/1234567890123456789',
      'https://x.com/obscura_vt/status/1234567890123456789/likes',
      'https://x.com/obscura_vt/status/1234567890123456789/photo/1/extra',
      'javascript:alert(1)',
      'https://user:pass@x.com/obscura_vt/status/1234567890123456789',
      'ftp://x.com/obscura_vt/status/1234567890123456789',
    ]
    for (const input of rejected) expect(normalizeXPostLink(input as never)).toBeNull()
  })

  it('satisfies the niche_photo_posts CHECK for every accepted result', () => {
    const samples = [
      'http://mobile.twitter.com/Abc_123/status/1?s=20&t=zz',
      'https://www.x.com/a/status/999/photo/1#frag',
      'https://twitter.com/i/web/status/42/',
    ]
    for (const sample of samples) {
      const result = normalizeXPostLink(sample)
      expect(result).toMatch(X_POST_URL_CHECK)
    }
  })
})
