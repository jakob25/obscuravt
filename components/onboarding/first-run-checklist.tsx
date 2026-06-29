'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Circle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VaultPanel } from '@/components/vault/vault-surfaces'

const STORAGE_KEY = 'vtvault_onboarding_dismissed'

interface ChecklistItem {
  id: string
  label: string
  href: string
  done: boolean
}

interface Props {
  circleCount: number
  betsPlaced: number
  tagStreak?: number
}

export function FirstRunChecklist({ circleCount, betsPlaced, tagStreak = 0 }: Props) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  const items: ChecklistItem[] = [
    { id: 'circle', label: 'Add a creator to Your Circle', href: '/discover', done: circleCount > 0 },
    { id: 'tag', label: 'Validate a tag in the Tag Validator', href: '/tag-validator', done: tagStreak > 0 },
    { id: 'bet', label: 'Place your first bet', href: '/bets', done: betsPlaced > 0 },
  ]

  const completed = items.filter(i => i.done).length
  const allDone = completed === items.length

  if (dismissed || allDone) return null

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    setDismissed(true)
  }

  return (
    <VaultPanel className="mb-6 border-vault-gold/25 bg-vault-gold/5 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-bold text-vault-cream">First run in the Vault</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completed}/{items.length} done — finish these to learn how Scraps and Your Circle work.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-muted-foreground hover:text-vault-cream p-1"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="space-y-2 mb-4">
        {items.map(item => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-2 text-sm text-vault-cream hover:text-vault-gold transition-colors"
            >
              {item.done ? (
                <Check className="h-4 w-4 text-green-400 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="vault" className="text-xs">
          <Link href="/help#vault-scraps">What are Vault Scraps?</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="text-xs border-vault-bronze/40">
          <Link href="/help">Full help hub</Link>
        </Button>
      </div>
    </VaultPanel>
  )
}