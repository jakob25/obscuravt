'use client'

import { useStarMapData } from '@/hooks/use-star-map-data'
import Link from 'next/link'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'

export default function ForumsIndexPage() {
  const { constellations, loading } = useStarMapData()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <PageBackNav fallbackHref="/discover" />
      <div className="mb-6">
        <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-1">
          Forums
        </GlitchHeading>
        <p className="text-muted-foreground text-sm">
          Constellation gossip. No algorithm, just vibes.
        </p>
      </div>
      <VaultDivider className="mb-6" />

      {loading && <p className="text-muted-foreground text-sm animate-pulse text-center py-8">Scanning constellations…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {constellations.map(c => (
          <Link
            key={c.id}
            href={`/forums/${c.id}`}
            className="group block"
          >
            <VaultPanel className="p-4 flex items-center gap-3 hover:border-vault-gold/30 transition-all">
              <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
              <div className="min-w-0">
                <div className="font-semibold text-vault-cream group-hover:text-vault-gold transition-colors truncate">{c.name}</div>
                {c.description && <div className="text-xs text-muted-foreground truncate">{c.description}</div>}
              </div>
            </VaultPanel>
          </Link>
        ))}
      </div>
    </div>
  )
}