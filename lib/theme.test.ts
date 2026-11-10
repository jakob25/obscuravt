import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME, isThemeName, parseThemeParam, THEME_STORAGE_KEY } from './theme'

describe('theme helpers', () => {
  it('treats only dark and light as theme names', () => {
    expect(isThemeName('dark')).toBe(true)
    expect(isThemeName('light')).toBe(true)
    expect(isThemeName('system')).toBe(false)
    expect(isThemeName('')).toBe(false)
    expect(isThemeName(null)).toBe(false)
  })

  it('parses a theme query param without inventing values', () => {
    expect(parseThemeParam('light')).toBe('light')
    expect(parseThemeParam('DARK')).toBe('dark')
    expect(parseThemeParam(' light ')).toBe('light')
    expect(parseThemeParam('system')).toBe(null)
    expect(parseThemeParam('sepia')).toBe(null)
    expect(parseThemeParam(undefined)).toBe(null)
  })

  it('keeps dark as the default theme name', () => {
    expect(DEFAULT_THEME).toBe('dark')
    expect(THEME_STORAGE_KEY).toBe('obscuravt-theme')
  })
})
