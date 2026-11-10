'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME}
      enableSystem
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
