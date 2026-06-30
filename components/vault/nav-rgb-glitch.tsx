'use client'

import { useRandomGlitch } from '@/hooks/use-random-glitch'
import { cn } from '@/lib/utils'

interface NavRgbGlitchProps {
  children: React.ReactNode
  className?: string
}

/**
 * Wraps the sticky header with CSS-only RGB chromatic-aberration bursts.
 * No full-page canvas — nav links stay clickable.
 */
export function NavRgbGlitch({ children, className }: NavRgbGlitchProps) {
  const { active, intensity, isMicro } = useRandomGlitch({ preset: 'nav' })

  return (
    <header
      className={cn(
        'nav-rgb-shell sticky top-0 z-50 w-full border-b border-border/50 bg-vault-deep/95 backdrop-blur supports-[backdrop-filter]:bg-vault-deep/80',
        active && 'nav-rgb-glitching',
        active && isMicro && 'nav-rgb-glitching-micro',
        className,
      )}
      style={
        active
          ? ({ '--nav-glitch-intensity': intensity } as React.CSSProperties)
          : undefined
      }
    >
      <div className="nav-rgb-glitch-target">
        <div className="nav-rgb-fx" aria-hidden>
          <div className="nav-rgb-tear nav-rgb-tear-a" />
          <div className="nav-rgb-tear nav-rgb-tear-b" />
          <div className="nav-rgb-scan" />
        </div>
        {children}
      </div>
    </header>
  )
}