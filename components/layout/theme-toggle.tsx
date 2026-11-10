'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import type { ThemeName } from '@/lib/theme'

const OPTIONS: { value: ThemeName; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const current = mounted && theme === 'light' ? 'light' : 'dark'

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">Site appearance</span>
      <div className="inline-flex rounded-lg border border-border p-0.5" role="group" aria-label="Site appearance">
        {OPTIONS.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-pressed={current === option.value}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              current === option.value
                ? 'bg-vault-gold text-vault-deep'
                : 'text-muted-foreground hover:text-vault-cream',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
