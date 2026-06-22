'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, TrendingUp, Trophy } from 'lucide-react'
import type { WeeklyDigest } from '@/lib/types'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'

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
      <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-2 flex items-center gap-2">
        <Calendar className="h-6 w-6 text-vault-gold" /> Weekly Digest
      </GlitchHeading>
      <p className="text-sm text-muted-foreground mb-8">Resets every Monday. This week in the Vault.</p>

      {loading && <p className="text-muted-foreground animate-pulse">Loading…</p>}

      {!loading && digest && (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-vault-cream mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-vault-gold" /> Top Clips
            </h2>
            {digest.topClips.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clips this week yet.</p>
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
              <h2 className="text-sm font-semibold text-vault-cream mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-vault-gold" /> Hottest Bet
              </h2>
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