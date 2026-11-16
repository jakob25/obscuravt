import { describe, expect, it } from 'vitest'
import { consumeComposeSearch, hideAddFabOnMobile, nextFabTucked } from './add-button'

describe('hideAddFabOnMobile', () => {
  it('hides the + button on the nominator and preview, or while the compose dialog is open', () => {
    expect(hideAddFabOnMobile('/nominator', false)).toBe(true)
    expect(hideAddFabOnMobile('/dev/vtuber-wizard-preview', false)).toBe(true)
    expect(hideAddFabOnMobile('/discover', true)).toBe(true)
  })

  it('leaves the + button in place on other pages when no wizard is open', () => {
    expect(hideAddFabOnMobile('/discover', false)).toBe(false)
    expect(hideAddFabOnMobile('/', false)).toBe(false)
    expect(hideAddFabOnMobile(null, false)).toBe(false)
  })
})

describe('consumeComposeSearch', () => {
  it('opens the Add VTuber dialog from compose=vtuber or nominate=1 and clears the flag', () => {
    expect(consumeComposeSearch('?compose=vtuber')).toEqual({ tab: 'vtuber', nextSearch: '' })
    expect(consumeComposeSearch('?nominate=1')).toEqual({ tab: 'vtuber', nextSearch: '' })
    expect(consumeComposeSearch('?compose=vtuber&ref=nav')).toEqual({ tab: 'vtuber', nextSearch: '?ref=nav' })
  })

  it('opens the clip tab and leaves unrelated queries alone', () => {
    expect(consumeComposeSearch('?compose=clip')).toEqual({ tab: 'clip', nextSearch: '' })
    expect(consumeComposeSearch('?foo=bar')).toEqual({ tab: null, nextSearch: '?foo=bar' })
    expect(consumeComposeSearch('')).toEqual({ tab: null, nextSearch: '' })
  })
})

describe('nextFabTucked', () => {
  it('tucks away while scrolling down mid-page and returns on scroll up', () => {
    expect(nextFabTucked(200, 260, 2000, false)).toBe(true)
    expect(nextFabTucked(600, 540, 2000, true)).toBe(false)
  })

  it('stays visible near the top and at the end of the page', () => {
    expect(nextFabTucked(0, 60, 2000, false)).toBe(false)
    expect(nextFabTucked(1900, 2000, 2000, true)).toBe(false)
  })

  it('ignores tiny scroll jitter', () => {
    expect(nextFabTucked(500, 504, 2000, true)).toBe(true)
    expect(nextFabTucked(500, 496, 2000, false)).toBe(false)
  })
})
