'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { WeeklyDigest } from '@/lib/types'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { VaultDivider } from '@/components/vault/vault-surfaces'

export default function WeeklyPage() {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/weekly')
      .then(r => r.json())
      .then(setDigest)
      .catch(() => setDigest(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-2">
        Weekly Digest
      </GlitchHeading>
      <p className="text-sm text-muted-foreground mb-4">Resets Monday. What happened while you weren&apos;t watching.</p>
      <VaultDivider className="mb-8" />

      {loading && <p className="text-muted-foreground animate-pulse">Pulling the tape…</p>}

      {!loading && digest && (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-vault-cream mb-3">Top Clips</h2>
            {digest.topClips.length === 0 ? (
              <p className="text-sm text-muted-foreground">Clip drought this week. Submit something cursed.</p>
            ) : (
              <div className="space-y-2">
                {digest.topClips.map(c => (
                  <VaultFrame key={c.id}>
                    <a href={c.clip_url} target="_blank" rel="noopener noreferrer" className="block p-4">
                      <p className="font-medium text-vault-cream text-sm">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.upvotes} upvotes · {c.vtuber_name}</p>
                    </a>
                  </VaultFrame>
                ))}
              </div>
            )}
          </section>

          {digest.topBet && (
            <section>
              <h2 className="text-sm font-semibold text-vault-cream mb-3">Hottest Bet</h2>
              <VaultFrame>
                <Link href="/bets" className="block p-4">
                  <p className="font-medium text-vault-cream">{digest.topBet.title}</p>
                  <p className="text-xs text-muted-foreground">{digest.topBet.entries} entries</p>
                </Link>
              </VaultFrame>
            </section>
          )}

          {digest.topVtuber && (
            <section>
              <h2 className="text-sm font-semibold text-vault-cream mb-3">Spotlight Creator</h2>
              <VaultFrame>
                <Link href={`/vtuber/${digest.topVtuber.id}`} className="block p-4 font-medium text-vault-cream">
                  {digest.topVtuber.name}
                </Link>
              </VaultFrame>
            </section>
          )}
        </div>
      )}
    </div>
  )
}