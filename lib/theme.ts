export type ThemeName = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'obscuravt-theme'
export const DEFAULT_THEME: ThemeName = 'dark'

export function isThemeName(value: string | null | undefined): value is ThemeName {
  return value === 'dark' || value === 'light'
}

/** Read ?theme=light or ?theme=dark from a query string or param value. */
export function parseThemeParam(value: string | null | undefined): ThemeName | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  return isThemeName(normalized) ? normalized : null
}
