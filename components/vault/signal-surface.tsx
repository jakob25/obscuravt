'use client'

import { cn } from '@/lib/utils'
import { useRandomGlitch, type GlitchPreset } from '@/hooks/use-random-glitch'
import { SignalGlitchLayers } from '@/components/vault/signal-glitch-layers'

interface SignalSurfaceProps {
  children: React.ReactNode
  className?: string
  preset?: GlitchPreset
  enabled?: boolean
  /** minimal = no horizontal tears / tracking (overlays only) */
  variant?: 'full' | 'minimal'
}

/** Ambient intercepted-signal wrapper for cards, heroes, and promo blocks */
export function SignalSurface({
  children,
  className,
  preset = 'surface',
  enabled = true,
  variant = 'full',
}: SignalSurfaceProps) {
  const { active, intensity, isMicro } = useRandomGlitch({ preset, enabled })

  return (
    <div
      className={cn(
        'signal-surface signal-interference relative overflow-hidden',
        active && 'is-glitching',
        isMicro && 'is-glitching-micro',
        className,
      )}
    >
      <SignalGlitchLayers active={active} intensity={intensity} variant={variant} />
      <div className="relative z-10">{children}</div>
    </div>
  )
}