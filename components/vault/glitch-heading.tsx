'use client'

import { cn } from '@/lib/utils'

interface GlitchHeadingProps {
  children: React.ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'span'
  /** Text for tri-channel glitch layers when children are not a plain string */
  glitchText?: string
  idle?: boolean
}

export function GlitchHeading({
  children,
  className,
  as: Tag = 'h2',
  glitchText,
  idle = true,
}: GlitchHeadingProps) {
  const plainText =
    typeof children === 'string' ? children : glitchText ?? null

  return (
    <Tag
      className={cn(
        'glitch-heading relative inline-block font-bold',
        plainText && idle && 'glitch-heading-idle',
        className,
      )}
      {...(plainText ? { 'data-text': plainText } : {})}
    >
      <span className="relative z-[2]">{children}</span>
    </Tag>
  )
}