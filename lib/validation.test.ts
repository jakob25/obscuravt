import { describe, it, expect } from 'vitest'
import { sanitizeText, sanitizeUrl, usernameSchema, passwordSchema, titleSchema, urlSchema, amountSchema, registerSchema, betSchema, parseBody } from './validation'

describe('sanitizeText', () => {
  it('trims whitespace and removes HTML tags + dangerous content', () => {
    expect(sanitizeText('  <script>alert(1)</script>Hello <b>World</b>  ')).toBe('Hello World')
  })
  it('strips javascript: protocol, event handlers, null bytes and normalizes spaces', () => {
    expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)')
    expect(sanitizeText('onclick=alert(1)')).toBe('')
    expect(sanitizeText('hello\u0000  world')).toBe('hello world')
  })
})

describe('sanitizeUrl', () => {
  it('accepts valid http/https URLs', () => {
    expect(sanitizeUrl('https://example.com/path?query=1')).toBe('https://example.com/path?query=1')
  })
  it('rejects non-http protocols and invalid URLs', () => {
    expect(sanitizeUrl('ftp://bad.com')).toBeNull()
    expect(sanitizeUrl('not-a-url')).toBeNull()
    expect(sanitizeUrl('javascript:void(0)')).toBeNull()
  })
})

describe('usernameSchema & passwordSchema', () => {
  it('accepts good usernames and passwords', () => {
    expect(usernameSchema.parse('blujayrx_42')).toBe('blujayrx_42')
    expect(passwordSchema.parse('SecurePass123!')).toBe('SecurePass123!')
  })
  it('rejects invalid usernames and short passwords', () => {
    expect(() => usernameSchema.parse('ab')).toThrow()
    expect(() => usernameSchema.parse('user name with spaces')).toThrow()
    expect(() => passwordSchema.parse('short')).toThrow()
  })
})

describe('betSchema and other domain schemas', () => {
  it('validates a complete bet payload', () => {
    const bet = { title: 'Next collab winner?', category: 'collab', options: ['Option A', 'Option B', 'Option C'] }
    expect(() => betSchema.parse(bet)).not.toThrow()
  })
  it('enforces minimum options and title length', () => {
    expect(() => betSchema.parse({ title: 'Hi', category: 'x', options: ['OnlyOne'] })).toThrow()
  })
})

describe('parseBody helper', () => {
  it('successfully parses and validates good JSON body', async () => {
    const req = new Request('http://local', { method: 'POST', body: JSON.stringify({ username: 'testuser', password: 'longenoughpass' }) })
    const res = await parseBody(req, registerSchema)
    expect(res).toHaveProperty('data')
  })
  it('returns structured error for bad input', async () => {
    const req = new Request('http://local', { method: 'POST', body: JSON.stringify({ username: 'no' }) })
    const res = await parseBody(req, registerSchema)
    expect(res).toHaveProperty('error')
    if ('error' in res) expect(res.status).toBe(400)
  })
})
