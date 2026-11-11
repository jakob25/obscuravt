import { describe, expect, it, vi } from 'vitest'
import { navigateAfterLogin, nextPathFromSearch, safeNextPath } from './safe-next-path'

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

describe('nextPathFromSearch', () => {
  it('honors a same-origin next path so the Add VTuber dialog can reopen', () => {
    expect(nextPathFromSearch('?next=%2F%3Fcompose%3Dvtuber')).toBe('/?compose=vtuber')
    expect(nextPathFromSearch('?next=%2Fdiscover%3Fcompose%3Dvtuber')).toBe('/discover?compose=vtuber')
    expect(nextPathFromSearch('?next=%2Fnominator')).toBe('/nominator')
  })

  it('rejects an external next and falls back to /', () => {
    expect(nextPathFromSearch('?next=https://evil.example/phish')).toBe('/')
    expect(nextPathFromSearch('?next=%2F%2Fevil.example')).toBe('/')
    expect(nextPathFromSearch('')).toBe('/')
  })
})

describe('navigateAfterLogin', () => {
  it('assigns the validated next path after a successful login', () => {
    const go = vi.fn()
    navigateAfterLogin('?next=%2Fdiscover%3Fcompose%3Dvtuber', go)
    expect(go).toHaveBeenCalledTimes(1)
    expect(go).toHaveBeenCalledWith('/discover?compose=vtuber')
  })

  it('does not follow an external next value', () => {
    const go = vi.fn()
    navigateAfterLogin('?next=https://evil.example/phish', go)
    expect(go).toHaveBeenCalledWith('/')
  })
})
