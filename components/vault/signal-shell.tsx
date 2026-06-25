'use client'

import { cn } from '@/lib/utils'
import { useRandomGlitch } from '@/hooks/use-random-glitch'
import { SignalGlitchLayers } from '@/components/vault/signal-glitch-layers'

/** Site-wide faint scanlines + rare viewport micro-glitches */
export function SignalShell({ children }: { children: React.ReactNode }) {
  const { active, intensity, isMicro } = useRandomGlitch({ preset: 'viewport' })

  return (
    <div className="relative min-h-full">
      <div
        className="pointer-events-none fixed inset-0 z-[1] vault-scanlines-subtle"
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-[2] signal-interference',
          active && 'is-glitching',
          isMicro && 'is-glitching-micro',
        )}
        aria-hidden
      >
        <SignalGlitchLayers active={active} intensity={intensity} variant="minimal" />
      </div>
      <div className="relative z-[3]">{children}</div>
    </div>
  )
}