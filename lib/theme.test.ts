import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THEME,
  isColorTheme,
  isThemeName,
  parseThemeParam,
  resolveThemeClass,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
} from './theme'

describe('theme helpers', () => {
  it('treats dark, light, and system as saved theme names', () => {
    expect(isThemeName('dark')).toBe(true)
    expect(isThemeName('light')).toBe(true)
    expect(isThemeName('system')).toBe(true)
    expect(isThemeName('')).toBe(false)
    expect(isThemeName(null)).toBe(false)
    expect(isThemeName('sepia')).toBe(false)
  })

  it('treats only dark and light as resolved color themes', () => {
    expect(isColorTheme('dark')).toBe(true)
    expect(isColorTheme('light')).toBe(true)
    expect(isColorTheme('system')).toBe(false)
  })

  it('parses a theme query param without inventing values', () => {
    expect(parseThemeParam('light')).toBe('light')
    expect(parseThemeParam('DARK')).toBe('dark')
    expect(parseThemeParam(' light ')).toBe('light')
    expect(parseThemeParam('system')).toBe(null)
    expect(parseThemeParam('sepia')).toBe(null)
    expect(parseThemeParam(undefined)).toBe(null)
  })

  it('defaults new visitors to matching the device', () => {
    expect(DEFAULT_THEME).toBe('system')
    expect(THEME_STORAGE_KEY).toBe('obscuravt-theme')
  })

  it('lets a saved dark or light choice win over the OS scheme', () => {
    expect(resolveThemeClass('dark', false)).toBe('dark')
    expect(resolveThemeClass('light', true)).toBe('light')
    expect(resolveThemeClass('system', false)).toBe('light')
    expect(resolveThemeClass('system', true)).toBe('dark')
    expect(resolveThemeClass(null, false)).toBe('light')
    expect(resolveThemeClass(null, true)).toBe('dark')
    expect(resolveThemeClass('sepia', true)).toBe('dark')
  })

  it('embeds the storage key and system default in the boot script', () => {
    expect(THEME_INIT_SCRIPT).toContain('obscuravt-theme')
    expect(THEME_INIT_SCRIPT).toContain('system')
    expect(THEME_INIT_SCRIPT).toContain('prefers-color-scheme: dark')
  })
})
