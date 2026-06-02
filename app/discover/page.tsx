'use client'

import { useState, useEffect } from 'react'
import { StarMap } from '@/components/common/star-map'
import { NicheMap } from '@/components/common/niche-map'
import { Sparkles, BookOpen } from 'lucide-react'

type MapMode = 'vibe' | 'niche'

function FirstTimerBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('vtvault_map_seen')) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <div className="bg-vault-gold/8 border-b border-vault-gold/20 px-4 py-3">
      <div className="container mx-auto flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">👋</span>
          <div>
            <p className="text-sm font-medium text-vault-cream">
              This is the Star Map — a vibe-based way to discover VTubers you've never heard of.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clusters are personality types, not genres. Scroll in to see individual creators.
              Click any creator to open their profile. Every profile links back to their real channel.
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShow(false); localStorage.setItem('vtvault_map_seen', '1') }}
          className="text-xs text-muted-foreground hover:text-vault-cream flex-shrink-0 mt-0.5"
        >
          Got it ✕
        </button>
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  const [mode, setMode] = useState<MapMode>('vibe')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with toggle */}
      <div className="border-b border-border px-4 py-4">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-vault-cream">
              {mode === 'vibe' ? 'Vibe Map' : 'Niche Map'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {mode === 'vibe'
                ? 'Explore by personality and energy — find creators who feel like your people.'
                : 'Explore by content category — find creators who stream what you want to watch.'
              }
            </p>
          </div>

          {/* Map toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border flex-shrink-0">
            <button
              onClick={() => setMode('vibe')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'vibe'
                  ? 'bg-vault-gold/20 text-vault-gold border border-vault-gold/30'
                  : 'text-muted-foreground hover:text-vault-cream'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Vibe Map</span>
            </button>
            <button
              onClick={() => setMode('niche')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'niche'
                  ? 'bg-vault-gold/20 text-vault-gold border border-vault-gold/30'
                  : 'text-muted-foreground hover:text-vault-cream'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Niche Map</span>
            </button>
          </div>
        </div>

        {/* Mode description pill */}
        <div className="container mx-auto mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          {mode === 'vibe' ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-vault-gold/60" />
                Clusters = personality types
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#e8c5f0]" />
                Parasocial Heart at center
              </span>
              <span>Scroll in to see individual creators</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#c0392b]" />
                Clusters = content niches
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#2980b9]" />
                Same creators, different lens
              </span>
              <span>Positioned by what they stream, not how they stream</span>
            </>
          )}
        </div>
      </div>

      {/* First-timer explainer — shown once via localStorage */}
      <FirstTimerBanner />

      {/* Map */}
      <div className="flex-1" style={{ minHeight: 500 }}>
        {mode === 'vibe'
          ? <StarMap />
          : <NicheMap />
        }
      </div>
    </div>
  )
}
