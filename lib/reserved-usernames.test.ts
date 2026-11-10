import { describe, expect, it } from 'vitest'
import { isReservedUsername, RESERVED_USERNAME_ERROR } from './reserved-usernames'

describe('isReservedUsername', () => {
  it('rejects reserved names ignoring case and spaces', () => {
    expect(isReservedUsername('Admin')).toBe(true)
    expect(isReservedUsername(' jakob25 ')).toBe(true)
    expect(isReservedUsername('ADMINISTRATOR')).toBe(true)
    expect(isReservedUsername('root')).toBe(true)
    expect(isReservedUsername('mod')).toBe(true)
    expect(isReservedUsername('Moderator')).toBe(true)
    expect(isReservedUsername('sys tem')).toBe(true)
    expect(isReservedUsername('staff')).toBe(true)
    expect(isReservedUsername('SUPPORT')).toBe(true)
    expect(isReservedUsername('obscuravt')).toBe(true)
  })

  it('allows ordinary usernames', () => {
    expect(isReservedUsername('BLUJAYRX')).toBe(false)
    expect(isReservedUsername('Nim')).toBe(false)
    expect(isReservedUsername('admin2')).toBe(false)
    expect(isReservedUsername(null)).toBe(false)
  })

  it('exports the friendly error copy', () => {
    expect(RESERVED_USERNAME_ERROR).toBe('That username is reserved')
  })
})
