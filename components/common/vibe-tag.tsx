'use client'

import { cn } from '@/lib/utils'
import { useVibeTags } from '@/hooks/use-data'
import type { VibeTag } from '@/lib/types'

interface VibeTagProps {
  tagId: string
  size?: 'sm' | 'md' | 'lg'
  showCategory?: boolean
  className?: string
}

export function VibeTag({ tagId, size = 'md', showCategory = false, className }: VibeTagProps) {
  const { vibeTags } = useVibeTags()
  const tag: VibeTag | undefined = vibeTags.find(t => t.id === tagId)

  if (!tag) return null

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  const categoryColors = {
    personality: 'border-vault-gold/50 bg-vault-gold/10',
    content: 'border-vault-amber/50 bg-vault-amber/10',
    theme: 'border-vault-bronze/50 bg-vault-bronze/10',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors',
        sizeClasses[size],
        categoryColors[tag.category],
        'text-vault-cream hover:bg-vault-gold/20',
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
      {tag.name}
      {showCategory && (
        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{tag.category}</span>
      )}
    </span>
  )
}

interface VibeTagListProps {
  tagIds: string[]
  size?: 'sm' | 'md' | 'lg'
  maxTags?: number
  className?: string
}

export function VibeTagList({ tagIds, size = 'md', maxTags, className }: VibeTagListProps) {
  const displayTags = maxTags ? tagIds.slice(0, maxTags) : tagIds
  const remainingCount = maxTags ? Math.max(0, tagIds.length - maxTags) : 0

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {displayTags.map(tagId => (
        <VibeTag key={tagId} tagId={tagId} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className={cn(
          'inline-flex items-center rounded-full border border-muted text-muted-foreground',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        )}>
          +{remainingCount} more
        </span>
      )}
    </div>
  )
}
