'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Shield, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface VTuberResult {
  id: string
  name: string
  handle: string
  platform: string
  bio: string
  is_claimed: boolean
}

export default function ClaimPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<VTuberResult[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    const { data } = await supabase
      .from('vtubers')
      .select('id, name, handle, platform, bio, is_claimed')
      .ilike('name', `%${query}%`)
      .eq('approved', true)
      .limit(10)
    setResults(data ?? [])
    setSearched(true)
    setSearching(false)
  }

  if (!user) return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="vault-card rounded-2xl p-8 max-w-sm w-full text-center">
        <Shield className="h-10 w-10 text-vault-gold mx-auto mb-4" />
        <h1 className="text-xl font-bold text-vault-cream mb-2">Claim Your Profile</h1>
        <p className="text-muted-foreground text-sm mb-6">Sign in to claim your VTuber profile and get verified.</p>
        <Link href="/login" className="inline-flex items-center justify-center w-full h-10 rounded-lg bg-vault-gold text-vault-deep font-semibold text-sm">Sign In</Link>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-vault-gold" />
          <h1 className="text-2xl font-bold text-vault-cream">Claim Your Profile</h1>
        </div>
        <p className="text-muted-foreground text-sm">Search for your VTuber name. If you're already on the map, request to claim it. If not, add yourself.</p>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search your VTuber name…"
          className="flex-1 h-11 px-4 rounded-xl bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground focus:outline-none focus:border-vault-bronze/60"
        />
        <button
          onClick={search}
          disabled={searching}
          className="h-11 px-5 rounded-xl bg-vault-gold text-vault-deep font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-3 mb-6">
          {results.map(vt => (
            <div key={vt.id} className="vault-card rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-vault-cream">{vt.name}</span>
                  {vt.is_claimed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-vault-gold/20 text-vault-gold border border-vault-gold/30 flex items-center gap-1">
                      <Shield className="h-2.5 w-2.5" /> Claimed
                    </span>
                  )}
                </div>
                {vt.handle && <p className="text-xs text-muted-foreground">{vt.handle}</p>}
                {vt.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{vt.bio}</p>}
              </div>
              {!vt.is_claimed ? (
                <Link
                  href={`/claim/${vt.id}`}
                  className="flex-shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-xs font-semibold"
                >
                  Claim <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="flex-shrink-0 text-xs text-muted-foreground">Already claimed</span>
              )}
            </div>
          ))}

          {results.length === 0 && (
            <div className="vault-card rounded-xl p-6 text-center">
              <p className="text-muted-foreground text-sm mb-4">No results for "{query}"</p>
              <button
                onClick={() => router.push(`/nominate?name=${encodeURIComponent(query)}`)}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-vault-bronze/40 text-vault-cream text-sm font-medium hover:bg-vault-bronze/10"
              >
                <Plus className="h-4 w-4 text-vault-gold" />
                Add yourself to ObscuraVT
              </button>
            </div>
          )}
        </div>
      )}

      {/* Not found CTA */}
      {!searched && (
        <div className="vault-card rounded-xl p-5 flex items-center justify-between gap-4 mt-4">
          <div>
            <p className="text-sm font-medium text-vault-cream">Not on the map yet?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Add yourself and get verified once approved.</p>
          </div>
          <Link href="/nominate" className="flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-vault-bronze/40 text-vault-cream text-xs font-medium hover:bg-vault-bronze/10">
            <Plus className="h-3.5 w-3.5" /> Add yourself
          </Link>
        </div>
      )}
    </div>
  )
}
