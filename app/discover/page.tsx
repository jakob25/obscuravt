'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { StarMap } from '@/components/common/star-map'
import { NicheMap } from '@/components/common/niche-map'
import Link from 'next/link'
import { Sparkles, BookOpen, Compass, List } from 'lucide-react'
import { DISCOVER_MAP_HINT } from '@/lib/site-copy'


type MapMode = 'vibe' | 'niche'

const MAP_HINT_SEEN_KEY = 'vtvault_map_seen'

function FirstTimerBanner({ mode, onClose }: { mode: MapMode; onClose: () => void }) {
  return (
    // max-sm:right-20 keeps the card clear of the floating + button (right-4, 56px wide) on phones.
    <div className="absolute bottom-4 left-4 max-sm:right-20 z-30 max-w-sm pointer-events-auto">
      <div className="bg-black/80 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <Compass className="h-5 w-5 text-vault-gold flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">
              <span className="sm:hidden">Pinch to zoom. Drag to pan. Tap a cluster. Find your people.</span>
              <span className="hidden sm:inline">Scroll to zoom. Click a cluster. Find your people.</span>
            </p>
            <p className="text-xs text-white/50 mt-0.5">
              {DISCOVER_MAP_HINT[mode]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm text-xs text-white/40 hover:text-white active:text-white flex-shrink-0 ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vault-gold/60 motion-safe:active:scale-[0.97] motion-reduce:active:opacity-80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function DiscoverPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialMode = (searchParams.get('view') as MapMode) === 'niche' ? 'niche' : 'vibe'
  const [mode, setMode] = useState<MapMode>(initialMode)
  // null until localStorage is read, so the map's own instruction pill never flashes
  // underneath the first-visit card.
  const [hintOpen, setHintOpen] = useState<boolean | null>(null)

  useEffect(() => {
    setHintOpen(!localStorage.getItem(MAP_HINT_SEEN_KEY))
  }, [])

  const closeHint = () => {
    setHintOpen(false)
    localStorage.setItem(MAP_HINT_SEEN_KEY, '1')
  }

  const handleModeChange = (newMode: MapMode) => {
    setMode(newMode)
    const params = new URLSearchParams(searchParams.toString())
    if (newMode === 'niche') {
      params.set('view', 'niche')
    } else {
      params.delete('view')
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'calc(100vh - 64px)' }}
    >
      {/* Toggle */}
      <div
        className="absolute top-3 left-4 z-30 flex items-center gap-1 p-1 rounded-xl bg-black/70 border border-white/10 backdrop-blur-sm pointer-events-auto"
        style={{ isolation: 'isolate' }}
      >
        <button
          type="button"
          aria-pressed={mode === 'vibe'}
          onClick={() => handleModeChange('vibe')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vault-gold/60 motion-safe:active:scale-[0.97] motion-reduce:active:opacity-80 ${
            mode === 'vibe'
              ? 'bg-vault-gold/20 text-vault-gold border-vault-gold/30'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Vibe Map
        </button>
        <button
          type="button"
          aria-pressed={mode === 'niche'}
          onClick={() => handleModeChange('niche')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vault-gold/60 motion-safe:active:scale-[0.97] motion-reduce:active:opacity-80 ${
            mode === 'niche'
              ? 'bg-vault-gold/20 text-vault-gold border-vault-gold/30'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Niche Map
        </button>
        <Link
          href="/search"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent text-xs font-medium text-white/50 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vault-gold/60 motion-safe:active:scale-[0.97] motion-reduce:active:opacity-80"
        >
          <List className="h-3.5 w-3.5" />
          List
        </Link>
      </div>

      {/* Map */}
      <div className="absolute inset-0">
        {mode === 'vibe' ? <StarMap /> : <NicheMap hideInstructionsOnPhone={hintOpen !== false} />}
      </div>

      {hintOpen && <FirstTimerBanner mode={mode} onClose={closeHint} />}
    </div>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div
          className="relative w-full overflow-hidden bg-vault-deep"
          style={{ height: 'calc(100vh - 64px)' }}
        />
      }
    >
      <DiscoverPageContent />
    </Suspense>
  )
}
