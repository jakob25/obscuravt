import { cn } from '@/lib/utils'

/** Thin glitch/static strip — use instead of plain hr or border-only dividers */
export function VaultDivider({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      className={cn('vault-divider relative h-px w-full my-6', className)}
      aria-hidden
    />
  )
}

/** Character sheet / dossier framing for VTuber profiles */
export function DossierFrame({
  children,
  className,
  stamp,
}: {
  children: React.ReactNode
  className?: string
  stamp?: string
}) {
  return (
    <div className={cn('dossier-frame relative', className)}>
      <div className="dossier-frame-tab" aria-hidden>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-vault-gold/70">
          {stamp ?? 'Archive dossier'}
        </span>
      </div>
      <div className="dossier-frame-body vault-grain vault-scanlines-subtle relative z-10">
        {children}
      </div>
    </div>
  )
}

/** Betting slip / ticket — distinct from generic cards */
export function BetSlip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bet-slip relative overflow-hidden', className)}>
      <div className="bet-slip-perforation" aria-hidden />
      <div className="bet-slip-stub" aria-hidden />
      <div className="relative z-10 p-5">{children}</div>
    </div>
  )
}

/** Masonry gallery wall for memes / fan art */
export function GalleryWall({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('gallery-wall columns-2 md:columns-3 gap-2 md:gap-3', className)}>
      {children}
    </div>
  )
}

export function GalleryWallItem({
  children,
  className,
  tilt,
}: {
  children: React.ReactNode
  className?: string
  /** subtle rotation variant for wall chaos */
  tilt?: 'left' | 'right' | 'none'
}) {
  return (
    <div
      className={cn(
        'gallery-wall-item break-inside-avoid mb-2 md:mb-3',
        tilt === 'left' && '-rotate-1',
        tilt === 'right' && 'rotate-1',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Clean data stat block — keep simple for numbers */
export function StatCard({
  label,
  value,
  featured,
  className,
}: {
  label: string
  value: React.ReactNode
  featured?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'stat-card rounded-lg border border-border/50 bg-muted/20 p-3',
        featured && 'stat-card-featured md:col-span-2',
        className,
      )}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-mono">{label}</p>
      <p className={cn('font-semibold text-vault-cream tabular-nums', featured ? 'text-3xl md:text-4xl text-vault-gold mt-1' : 'text-base mt-0.5')}>
        {value}
      </p>
    </div>
  )
}

/** Key panel with vault-door corner framing */
export function VaultPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('vault-panel relative vault-grain', className)}>
      <span className="vault-panel-corner vault-panel-corner-tl" aria-hidden />
      <span className="vault-panel-corner vault-panel-corner-tr" aria-hidden />
      <span className="vault-panel-corner vault-panel-corner-bl" aria-hidden />
      <span className="vault-panel-corner vault-panel-corner-br" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  )
}