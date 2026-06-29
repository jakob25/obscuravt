'use client'

import { cn } from '@/lib/utils'

interface GlitchHeadingProps {
  children: React.ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'span'
  /** case = GovtAgentBB dossier voice; stamp = Top Secret accent */
  variant?: 'default' | 'case' | 'stamp' | 'archive'
  /** Text for tri-channel glitch layers when children are not a plain string */
  glitchText?: string
  idle?: boolean
}

const VARIANT_CLASS: Record<NonNullable<GlitchHeadingProps['variant']>, string> = {
  default: '',
  case: 'font-govt tracking-wide',
  stamp: 'font-stamp tracking-wider uppercase',
  archive: 'font-archive tracking-wide',
}

export function GlitchHeading({
  children,
  className,
  as: Tag = 'h2',
  variant = 'default',
  glitchText,
  idle = false,
}: GlitchHeadingProps) {
  const plainText =
    typeof children === 'string' ? children : glitchText ?? null

  return (
    <Tag
      className={cn(
        'glitch-heading relative inline-block font-bold',
        VARIANT_CLASS[variant],
        plainText && idle && 'glitch-heading-idle',
        className,
      )}
      {...(plainText ? { 'data-text': plainText } : {})}
    >
      <span className="relative z-[2]">{children}</span>
    </Tag>
  )
}