'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { parseThemeParam } from '@/lib/theme'

/** Honor ?theme=light or ?theme=dark without adding a new nav item. */
export function ThemeQuerySync() {
  const { setTheme } = useTheme()

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('theme')
    const theme = parseThemeParam(value)
    if (theme) setTheme(theme)
  }, [setTheme])

  return null
}
