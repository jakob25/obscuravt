import { cn } from '@/lib/utils'
import { SignalSurface } from '@/components/vault/signal-surface'

interface VaultFrameProps {
  children: React.ReactNode
  className?: string
  signal?: boolean
}

/** Vault card with scanlines + ambient signal interference */
export function VaultFrame({ children, className, signal = true }: VaultFrameProps) {
  const inner = (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212,168,67,0.5) 2px, rgba(212,168,67,0.5) 4px)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </>
  )

  if (!signal) {
    return (
      <div className={cn('relative vault-card rounded-xl overflow-hidden border border-border/80', className)}>
        {inner}
      </div>
    )
  }

  return (
    <SignalSurface
      preset="surface"
      className={cn('vault-card rounded-xl border border-border/80', className)}
    >
      {inner}
    </SignalSurface>
  )
}