import { describe, expect, it } from 'vitest'
import { safeNextPath } from './safe-next-path'

describe('safeNextPath', () => {
  it('keeps a same-origin relative path, including a query string', () => {
    expect(safeNextPath('/nominator')).toBe('/nominator')
    expect(safeNextPath('/discover?compose=vtuber')).toBe('/discover?compose=vtuber')
    expect(safeNextPath('  /nominator  ')).toBe('/nominator')
  })

  it('rejects anything that could leave the site, and falls back to /', () => {
    expect(safeNextPath(null)).toBe('/')
    expect(safeNextPath('https://evil.example/phish')).toBe('/')
    expect(safeNextPath('//evil.example')).toBe('/')
    expect(safeNextPath('/\\evil.example')).toBe('/')
    expect(safeNextPath('nominator')).toBe('/')
    expect(safeNextPath('/login?next=https://evil.example')).toBe('/')
  })
})
