'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { PageBackNav } from '@/components/vault/page-back-nav'

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  fallbackHref?: string
  backLabel?: string
  preferFallback?: boolean
  variant?: 'default' | 'case' | 'stamp' | 'archive'
  glitchText?: string
  headingClassName?: string
  descriptionClassName?: string
  className?: string
  icon?: ReactNode
  actions?: ReactNode
}

/**
 * Shared back + title header for inner pages.
 * The back link is always on its own row so the title cannot sit beside it.
 */
export function PageHeader({
  title,
  description,
  fallbackHref,
  backLabel,
  preferFallback,
  variant = 'default',
  glitchText,
  headingClassName,
  descriptionClassName,
  className,
  icon,
  actions,
}: PageHeaderProps) {
  return (
    <header className={cn('block mb-6', className)}>
      <PageBackNav
        fallbackHref={fallbackHref}
        label={backLabel}
        preferFallback={preferFallback}
        className="mb-3"
      />
      <div className={cn(actions && 'flex items-start justify-between gap-3')}>
        <div className="min-w-0">
          <div className={cn(icon && 'flex items-center gap-2')}>
            {icon}
            <GlitchHeading
              as="h1"
              variant={variant}
              glitchText={glitchText}
              className={cn('block text-2xl font-bold text-vault-cream mb-1', headingClassName)}
            >
              {title}
            </GlitchHeading>
          </div>
          {description != null && description !== '' ? (
            <p className={cn('text-sm text-muted-foreground', descriptionClassName)}>
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </div>
    </header>
  )
}
