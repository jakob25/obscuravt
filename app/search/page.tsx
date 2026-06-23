'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useVTubers } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { VaultDivider } from '@/components/vault/vault-surfaces'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const { vtubers, loading } = useVTubers()
  const { constellations } = useStarMapData()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return vtubers.filter(v => {
      const c = constellations.find(x => x.id === v.category)
      return (
        v.name.toLowerCase().includes(q) ||
        (v.bio ?? '').toLowerCase().includes(q) ||
        (c?.name ?? '').toLowerCase().includes(q) ||
        v.vibeTags.some(t => t.toLowerCase().includes(q))
      )
    })
  }, [query, vtubers, constellations])

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-2">
        Search the Vault
      </GlitchHeading>
      <p className="text-sm text-muted-foreground mb-4">Name, tag, constellation — find who the algorithm hid.</p>
      <VaultDivider className="mb-6" />

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Name, vibe tag, constellation…"
        className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border text-vault-cream placeholder:text-muted-foreground focus:outline-none focus:border-vault-gold/40 mb-6"
        autoFocus
      />

      {loading && <p className="text-muted-foreground text-sm animate-pulse">Searching the archive…</p>}

      {!loading && query && results.length === 0 && (
        <p className="text-muted-foreground text-sm">Nothing for &ldquo;{query}&rdquo;. Try a vibe tag.</p>
      )}

      <div className="space-y-3">
        {results.map(v => {
          const c = constellations.find(x => x.id === v.category)
          return (
            <VaultFrame key={v.id}>
              <Link href={`/vtuber/${v.id}`} className="block p-4 hover:border-vault-gold/30 transition-all">
                <div className="flex items-center gap-3">
                  <img src={v.avatarUrl} alt="" className="h-10 w-10 rounded-full border border-vault-bronze/40" />
                  <div className="min-w-0">
                    <p className="font-semibold text-vault-cream">{v.name}</p>
                    {c && <p className="text-xs" style={{ color: c.color }}>{c.name}</p>}
                  </div>
                </div>
              </Link>
            </VaultFrame>
          )
        })}
      </div>
    </div>
  )
}