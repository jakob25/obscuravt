'use client'

import { cn } from '@/lib/utils'

interface GlitchHeadingProps {
  children: React.ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}

export function GlitchHeading({ children, className, as: Tag = 'h2' }: GlitchHeadingProps) {
  return (
    <Tag className={cn('relative inline-block', className)}>
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className="absolute inset-0 text-vault-gold/30 translate-x-[1px] -translate-y-[1px] select-none pointer-events-none animate-pulse"
      >
        {children}
      </span>
    </Tag>
  )
}