'use client'

import { useRef } from 'react'
import { useNavGlitch } from '@/hooks/use-nav-glitch'
import { cn } from '@/lib/utils'

interface NavRgbGlitchProps {
  children: React.ReactNode
  className?: string
}

/**
 * Sticky header with two independent glitch channels:
 * - Section RGB background flashes (random slices of the bar)
 * - Per-button chromatic tears on nav controls
 * Channels may run together but never overlap spatially.
 */
export function NavRgbGlitch({ children, className }: NavRgbGlitchProps) {
  const headerRef = useRef<HTMLElement>(null)
  const { bgFlashes } = useNavGlitch(headerRef)

  return (
    <header
      ref={headerRef}
      className={cn(
        'nav-rgb-shell sticky top-0 z-50 w-full border-b border-border/50 bg-vault-deep/95 backdrop-blur supports-[backdrop-filter]:bg-vault-deep/80',
        className,
      )}
    >
      <div className="nav-rgb-glitch-target">
        <div className="nav-rgb-fx" aria-hidden>
          {bgFlashes.map(flash => (
            <div
              key={flash.id}
              className={cn(
                'nav-rgb-bg-section',
                flash.micro && 'nav-rgb-bg-section-micro',
              )}
              style={
                {
                  '--nav-bg-left': `${flash.left}%`,
                  '--nav-bg-width': `${flash.width}%`,
                  '--nav-glitch-intensity': flash.intensity,
                } as React.CSSProperties
              }
            >
              <div className="nav-rgb-bg-section-chroma" />
              <div className="nav-rgb-tear nav-rgb-tear-a" />
              <div className="nav-rgb-tear nav-rgb-tear-b" />
              <div className="nav-rgb-scan" />
            </div>
          ))}
        </div>
        {children}
      </div>
    </header>
  )
}