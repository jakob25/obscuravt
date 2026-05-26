import { cn } from '@/lib/utils'

interface ScrapsCounterProps {
  amount: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ScrapsCounter({ amount, size = 'md', showLabel = true, className }: ScrapsCounterProps) {
  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  }
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    notation: amount >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(amount)
  
  return (
    <div className={cn('inline-flex items-center font-medium', sizeClasses[size], className)}>
      <div className={cn(
        'rounded-full bg-gradient-to-br from-vault-gold to-vault-amber',
        iconSizes[size]
      )} />
      <span className="text-vault-cream">{formattedAmount}</span>
      {showLabel && (
        <span className="text-muted-foreground">Scraps</span>
      )}
    </div>
  )
}
