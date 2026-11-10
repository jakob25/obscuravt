export type ColorTheme = 'dark' | 'light'
export type ThemeName = ColorTheme | 'system'

export const THEME_STORAGE_KEY = 'obscuravt-theme'
export const DEFAULT_THEME: ThemeName = 'system'

export function isColorTheme(value: string | null | undefined): value is ColorTheme {
  return value === 'dark' || value === 'light'
}

export function isThemeName(value: string | null | undefined): value is ThemeName {
  return isColorTheme(value) || value === 'system'
}

/** Read ?theme=light or ?theme=dark from a query string or param value. */
export function parseThemeParam(value: string | null | undefined): ColorTheme | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  return isColorTheme(normalized) ? normalized : null
}

/** Resolve the html class for a stored preference and the OS color scheme. */
export function resolveThemeClass(
  stored: string | null | undefined,
  prefersDark: boolean,
): ColorTheme {
  const preference = isThemeName(stored) ? stored : DEFAULT_THEME
  if (isColorTheme(preference)) return preference
  return prefersDark ? 'dark' : 'light'
}

/** Blocking head script so the first paint matches storage or the OS scheme. */
export const THEME_INIT_SCRIPT = `(function(){try{var stored=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var theme=stored==='light'||stored==='dark'||stored==='system'?stored:${JSON.stringify(DEFAULT_THEME)};var resolved=theme==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;if(resolved!=='light'&&resolved!=='dark')resolved='dark';var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(root.style)root.style.colorScheme=resolved;}catch(e){}})();`
