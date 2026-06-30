'use client'

import { cn } from '@/lib/utils'
import { useRandomGlitch } from '@/hooks/use-random-glitch'
import { SignalGlitchLayers } from '@/components/vault/signal-glitch-layers'


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

/**
 * Subject dossier — the cold archive-terminal shell wrapping a warm
 * aged case-folder. Used on VTuber profile pages.
 *
 * Backward compatible: existing callers passing only `stamp` / `children`
 * / `className` render unchanged in structure, just with the real visual
 * treatment instead of the flat gold-on-dark placeholder.
 *
 * New optional props:
 *  - caseId: shown top-right of the archive header (e.g. "CASE NO. OVT-04471")
 *  - accessLine: small cyan status line under the label (e.g. "ACCESS GRANTED")
 *
 * Signal glitches fire randomly while the dossier is on screen (no button).
 */
export function DossierFrame({
  children,
  className,
  stamp,
  caseId,
  accessLine,
}: {
  children: React.ReactNode
  className?: string
  stamp?: string
  caseId?: string
  accessLine?: string
}) {
  const { active: glitching, intensity, isMicro } = useRandomGlitch({ preset: 'dossier' })

  return (
    <div
      className={cn(
        'archive-shell signal-interference relative',
        glitching && 'is-glitching',
        isMicro && 'is-glitching-micro',
        className,
      )}
    >
      <SignalGlitchLayers active={glitching} intensity={intensity} />

      <div className="archive-header">
        <div>
          <div className="archive-label">{stamp ?? 'ObscuraVT · Subject Archive'}</div>
          {accessLine && <span className="archive-access">{accessLine}</span>}
        </div>
        {caseId && <div className="archive-case-id">{caseId}</div>}
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  )
}

/**
 * The warm aged-paper case folder that sits inside a DossierFrame.
 * Holds the photo slot, typewriter fields, optional classified stamp,
 * and a coffee stain. Composition only — no data fetching.
 */
export function CaseFolder({
  children,
  className,
  stampLabel,
  stampSub,
  showStain = true,
}: {
  children: React.ReactNode
  className?: string
  stampLabel?: string
  stampSub?: string
  showStain?: boolean
}) {
  return (
    <div className={cn('case-folder', className)}>
      {stampLabel && (
        <div className="case-stamp">
          {stampLabel}
          {stampSub && <div className="case-stamp-sub">{stampSub}</div>}
        </div>
      )}
      {children}
      {showStain && <div className="case-stain" aria-hidden />}
    </div>
  )
}

/** Polaroid-style avatar with a paperclip — the photo slot in a case folder */
export function CasePhoto({
  src,
  alt,
  caption,
  size = 'default',
}: {
  src?: string | null
  alt: string
  caption?: string
  size?: 'default' | 'lg'
}) {
  return (
    <div className={size === 'lg' ? 'case-photo-slot case-photo-slot-lg' : 'case-photo-slot'}>
      <svg className="case-paperclip" viewBox="0 0 30 46" fill="none" aria-hidden>
        <path
          d="M9 6 C9 2.5 12 0.5 15.5 0.5 C19.5 0.5 22.5 3.5 22.5 8 L22.5 34 C22.5 38 19.5 41 15.5 41 C12 41 9.5 38.5 9.5 35 L9.5 14 C9.5 11.8 11 10.5 12.8 10.5 C14.6 10.5 15.8 11.8 15.8 13.5 L15.8 30"
          stroke="#9a9a9a"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      <div className="case-polaroid">
        <div className="case-polaroid-photo">
          {src ? (
            <img src={src} alt={alt} />
          ) : (
            <div className="case-polaroid-fallback">{alt.charAt(0).toUpperCase()}</div>
          )}
        </div>
        {caption && (
          <div className="font-mono text-[10px] text-center mt-2 tracking-wide text-[var(--case-ink-dim)]">
            {caption}
          </div>
        )}
      </div>
    </div>
  )
}

/** A single typewriter-style KEY / value row inside a case folder */
export function CaseField({
  label,
  value,
  redacted = false,
}: {
  label: string
  value?: React.ReactNode
  redacted?: boolean
}) {
  return (
    <div className="case-field-row">
      <span className="case-field-key">{label}</span>
      <span className="case-field-val">
        {redacted ? (
          <span className="case-redacted">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        ) : (
          value ?? '—'
        )}
      </span>
    </div>
  )
}

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