'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, FolderOpen, Search, X } from 'lucide-react'

const SEEN_KEY = 'vtvault_start_here_dismissed'

export interface StartHereProps {
  /** A creator file from the current fresh clips, so step 2 lands on a real page. */
  creatorHref?: string | null
  creatorName?: string | null
}

/**
 * First-visit path: watch a clip → open a creator → try a vibe search. Server-rendered
 * visible (so no-JS readers get it too) and hidden once dismissed on this device.
 */
export function StartHere({ creatorHref, creatorName }: StartHereProps) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read device-only flag after hydration
      if (localStorage.getItem(SEEN_KEY) === '1') setHidden(true)
    } catch {}
  }, [])

  if (hidden) return null

  const dismiss = () => {
    setHidden(true)
    try { localStorage.setItem(SEEN_KEY, '1') } catch {}
  }

  const steps = [
    { n: 1, icon: Play, title: 'Watch a clip', body: 'Start with a short moment from a stream.', href: '/clips', cta: 'Open clips' },
    {
      n: 2,
      icon: FolderOpen,
      title: 'Open a creator',
      body: creatorName ? `See ${creatorName}'s file: clips, tags and channel link.` : 'Every clip links back to the creator’s file.',
      href: creatorHref || '/search',
      cta: creatorName ? `Open ${creatorName}` : 'Browse creators',
    },
    { n: 3, icon: Search, title: 'Try a vibe search', body: 'Search by vibe tag or constellation, not sub count.', href: '/search', cta: 'Search by vibe' },
  ]

  return (
    <section aria-labelledby="start-here-title" className="vault-card rounded-xl border border-border bg-vault-deep/40 p-panel" data-testid="start-here">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 id="start-here-title" className="text-base font-bold text-vault-cream">New here? Start with these three</h2>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide the start-here steps"
          className="-m-1 p-1 rounded-md text-muted-foreground hover:text-vault-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.97]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map(s => (
          <li key={s.n}>
            <Link
              href={s.href}
              aria-label={`Step ${s.n}: ${s.title}. ${s.cta}`}
              className="group flex h-full items-start gap-3 rounded-lg border border-border bg-vault-deep/40 p-3 hover:border-vault-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.98] motion-safe:transition-transform"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-vault-gold/15 text-vault-gold">
                <s.icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-vault-cream">{s.n}. {s.title}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{s.body}</span>
                <span className="block text-xs text-vault-gold mt-1 group-hover:underline">{s.cta} →</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
