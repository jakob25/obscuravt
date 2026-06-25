'use client'

import { cn } from '@/lib/utils'

interface GlitchHeadingProps {
  children: React.ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3'
  /** Idle micro-glitch vs only on hover */
  idle?: boolean
}

export function GlitchHeading({
  children,
  className,
  as: Tag = 'h2',
  idle = true,
}: GlitchHeadingProps) {
  const plainText = typeof children === 'string' ? children : null

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