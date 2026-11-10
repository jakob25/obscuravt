import { describe, expect, it } from 'vitest'
import { hideAddFabOnMobile } from './add-button'

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
