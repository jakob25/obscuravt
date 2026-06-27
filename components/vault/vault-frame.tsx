import { cn } from '@/lib/utils'

interface VaultFrameProps {
  children: React.ReactNode
  className?: string
}

/** Vault card with subtle scanline + gold edge glow */
export function VaultFrame({ children, className }: VaultFrameProps) {
  return (
    <div className={cn('relative vault-card rounded-xl overflow-hidden border border-border/80', className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] z-0"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212,168,67,0.5) 2px, rgba(212,168,67,0.5) 4px)' }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}