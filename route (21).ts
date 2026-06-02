'use client'

import { useState, useMemo } from 'react'
import { useVTubers, useVibeTags } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'
import type { VTuber } from '@/lib/types'
import { Search, X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SearchPage() {
  const { vtubers, loading } = useVTubers()
  const { vibeTags } = useVibeTags()
  const { constellations } = useStarMapData()

  const [query, setQuery] = useState('')
  const [selectedConstellation, setSelectedConstellation] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const toggleTag = (id: string) =>
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  const clearAll = () => { setQuery(''); setSelectedConstellation(null); setSelectedTags([]) }
  const hasFilters = query || selectedConstellation || selectedTags.length > 0

  const results = useMemo(() => {
    if (!hasFilters) return vtubers

    const q = query.toLowerCase().trim()

    return vtubers.filter(v => {
      // Text match
      const textMatch = !q || (
        v.name.toLowerCase().includes(q) ||
        v.bio?.toLowerCase().includes(q) ||
        v.vibeTags.some(t => {
          const tag = vibeTags.find(vt => vt.id === t)
          return tag?.name.toLowerCase().includes(q)
        })
      )

      // Constellation filter
      const constMatch = !selectedConstellation || v.category === selectedConstellation

      // Tag filter (all selected tags must be present)
      const tagMatch = selectedTags.length === 0 ||
        selectedTags.every(t => v.vibeTags.includes(t))

      return textMatch && constMatch && tagMatch
    })
  }, [query, selectedConstellation, selectedTags, vtubers, vibeTags, hasFilters])

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-vault-cream mb-6 flex items-center gap-2">
        <Search className="h-6 w-6 text-vault-gold" />
        Search
      </h1>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Search VTubers by name, bio, or vibe..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-10 pr-10 bg-muted/30 border-border text-vault-cream placeholder:text-muted-foreground h-11 text-base"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-vault-cream"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(p => !p)}
          className={`border-border text-vault-cream gap-2 ${showFilters ? 'bg-vault-gold/10 border-vault-gold/40' : ''}`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {(selectedConstellation || selectedTags.length > 0) && (
            <span className="bg-vault-gold text-vault-deep rounded-full h-4 w-4 text-xs flex items-center justify-center font-bold">
              {(selectedConstellation ? 1 : 0) + selectedTags.length}
            </span>
          )}
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-vault-cream gap-1">
            <X className="h-3.5 w-3.5" /> Clear all
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {loading ? '…' : `${results.length} creator${results.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="vault-card rounded-xl p-4 mb-6 space-y-4">
          {/* Constellations */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Constellation</p>
            <div className="flex flex-wrap gap-2">
              {constellations.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedConstellation(prev => prev === c.id ? null : c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedConstellation === c.id
                      ? 'border-current'
                      : 'border-border text-muted-foreground hover:text-vault-cream hover:border-vault-bronze/40'
                  }`}
                  style={selectedConstellation === c.id
                    ? { borderColor: c.color, color: c.color, background: `${c.color}15` }
                    : {}}
                >
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Vibe tags */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vibe Tags</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {vibeTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-vault-gold/20 border-vault-gold text-vault-gold'
                      : 'border-border text-muted-foreground hover:border-vault-bronze/40 hover:text-vault-cream'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="vault-card rounded-xl p-4 h-20 animate-pulse bg-muted/20" />
          ))}
        </div>
      ) : !hasFilters ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>Start typing to search {vtubers.length} creators</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-2">No results found.</p>
          <button onClick={clearAll} className="text-vault-gold hover:underline text-sm">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map(vtuber => {
            const constellation = constellations.find(c => c.id === vtuber.category)
            const matchedTags = vtuber.vibeTags
              .map(id => vibeTags.find(t => t.id === id))
              .filter(Boolean)
              .slice(0, 4)

            return (
              <Link
                key={vtuber.id}
                href={`/vtuber/${vtuber.id}`}
                className="vault-card rounded-xl p-4 flex items-center gap-4 hover:border-vault-gold/30 transition-all group"
              >
                <img
                  src={vtuber.avatarUrl}
                  alt={vtuber.name}
                  className="h-12 w-12 rounded-full border-2 border-vault-bronze/40 group-hover:border-vault-gold/40 transition-colors flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-vault-cream group-hover:text-vault-gold transition-colors">
                      {vtuber.name}
                    </span>
                    {constellation && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full border flex-shrink-0"
                        style={{ borderColor: `${constellation.color}50`, color: constellation.color, background: `${constellation.color}12` }}
                      >
                        {constellation.name}
                      </span>
                    )}
                  </div>
                  {vtuber.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{vtuber.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {matchedTags.map(tag => tag && (
                      <span
                        key={tag.id}
                        className={`px-1.5 py-0.5 rounded text-[10px] border ${
                          selectedTags.includes(tag.id)
                            ? 'bg-vault-gold/20 border-vault-gold/50 text-vault-gold'
                            : 'border-border text-muted-foreground bg-muted/20'
                        }`}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
