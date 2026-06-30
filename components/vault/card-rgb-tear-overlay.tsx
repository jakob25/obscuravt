'use client'

import { useCardRgbGlitch } from '@/hooks/use-card-rgb-glitch'
import { cn } from '@/lib/utils'

interface CardRgbTearOverlayProps {
  /** Stagger glitches across sibling cards */
  staggerIndex?: number
}

/**
 * Analog RGB horizontal tear lines over colored card backgrounds.
 * Sits inside overflow-hidden panels — does not affect layout or clicks.
 */
export function CardRgbTearOverlay({ staggerIndex = 0 }: CardRgbTearOverlayProps) {
  const staggerMs = staggerIndex * 2800
  const { active, intensity, micro, tears } = useCardRgbGlitch({ staggerMs })

  return (
    <div
      className={cn(
        'card-rgb-glitch pointer-events-none absolute inset-0 z-[1]',
        active && 'is-glitching',
        active && micro && 'is-glitching-micro',
      )}
      style={{ '--card-glitch-intensity': intensity } as React.CSSProperties}
      aria-hidden
    >
      <div className="card-rgb-scanlines" />
      <div className="card-rgb-static" />
      <div className="card-rgb-chroma" />
      {tears.map(tear => (
        <div
          key={tear.id}
          className="card-rgb-tear-line"
          style={
            {
              '--tear-top': `${tear.top}%`,
              '--tear-h': `${tear.height}px`,
              '--tear-shift': `${tear.shift}px`,
              '--tear-delay': `${tear.delay}s`,
              '--tear-dur': `${tear.duration}s`,
              '--tear-iter': tear.iterations,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}