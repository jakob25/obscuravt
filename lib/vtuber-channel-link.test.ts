import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabaseAdmin: {} }))

import { shouldTakeTwitchDisplayName } from './vtuber-channel-link'

describe('shouldTakeTwitchDisplayName', () => {
  it('keeps a hand-styled name that only compacts to the login', () => {
    expect(shouldTakeTwitchDisplayName('Mai Kyua', ['maikyua', 'maikyua', 'maikyua'], false)).toBe(false)
  })
  it('fills a name that is just the login placeholder', () => {
    expect(shouldTakeTwitchDisplayName('maikyua', ['maikyua'], false)).toBe(true)
    expect(shouldTakeTwitchDisplayName('@MaiKyua', ['maikyua'], false)).toBe(true)
  })
  it('fills an empty name', () => {
    expect(shouldTakeTwitchDisplayName('  ', ['x'], false)).toBe(true)
  })
  it('still follows a changed Twitch login', () => {
    expect(shouldTakeTwitchDisplayName('Old Name', ['old', 'new'], true)).toBe(true)
  })
})
