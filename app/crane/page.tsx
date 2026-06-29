'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultDivider } from '@/components/vault/vault-surfaces'
import { CraneMachine } from '@/components/discovery/crane-machine'
import type { DiscoveryPrize } from '@/lib/discovery-games'
import { Button } from '@/components/ui/button'

export default function CranePage() {
  const { user } = useAuth()
  const [prizes, setPrizes] = useState<DiscoveryPrize[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/discovery-games/crane')
      .then(r => r.ok ? r.json() : { prizes: [] })
      .then(d => setPrizes(d.prizes ?? []))
      .catch(() => setPrizes([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-lg px-4 py-8">
        <GlitchHeading as="h1" variant="case" className="text-2xl font-bold text-vault-cream mb-2">
          Vault Crane
        </GlitchHeading>
        <p className="text-sm text-muted-foreground mb-4">
          Carnival claw, archive edition. Line up the claw and try to snag a VTuber dossier — profile pics are the prizes.
        </p>
        <VaultDivider className="mb-6" />

        {!user && (
          <p className="text-xs text-muted-foreground mb-4 text-center">
            <Link href="/login" className="text-vault-gold hover:underline">Sign in</Link>
            {' '}to save catches to your vault record.
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground text-center animate-pulse py-16">Loading prizes…</p>
        ) : (
          <CraneMachine prizes={prizes} />
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" size="sm" className="border-vault-bronze/40">
            <Link href="/silhouette">Who Is This?</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-vault-bronze/40">
            <Link href="/discovery-games">All discovery games</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-vault-bronze/40">
            <Link href="/discover">Star Map</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}