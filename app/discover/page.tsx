'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { StarMap } from '@/components/common/star-map'
import { NicheMap } from '@/components/common/niche-map'
import { Sparkles, BookOpen } from 'lucide-react'

type MapMode = 'vibe' | 'niche'

function FirstTimerBanner() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!localStorage.getItem('vtvault_map_seen')) setShow(true)
  }, [])
  if (!show) return null
  return (
    <div className="absolute bottom-4 left-4 z-30 max-w-sm pointer-events-auto">
      <div className="bg-black/80 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm flex items-start gap-3">
        <span className="text-lg flex-shrink-0">Scroll to zoom in — click any cluster to explore it.</span>
        <p className="text-sm font-medium text-white">Scroll to zoom in — click any cluster to explore it.</p>
        <p className="text-xs text-white/50 mt-0.5">Constellations are personality types, not genres.</p>
        <button
          onClick={() => { setShow(false); localStorage.setItem('vtvault_map_seen', '1') }}
          className="text-xs text-white/40 hover:text-white flex-shrink-0"
        >Close</button>
      </div>
    </div>
  )
}

function DiscoverPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Sync mode with URL (?view=niche or ?view=vibe). Default = vibe
  const initialMode = (searchParams.get('view') as MapMode) === 'niche' ? 'niche' : 'vibe'
  const [mode, setMode] = useState<MapMode>(initialMode)

  // When mode changes, update the URL so browser back button preserves the correct tab
  const handleModeChange = (newMode: MapMode) => {
    setMode(newMode)
    const params = new URLSearchParams(searchParams.toString())
    if (newMode === 'niche') {
      params.set('view', 'niche')
    } else {
      params.delete('view') // clean URL for default vibe
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'calc(100vh - 64px)' }}
    >
      {/* Toggle — fixed z-index, pointer-events always on, never inside canvas */}
      <div
        className="absolute top-3 left-4 z-30 flex items-center gap-1 p-1 rounded-xl bg-black/70 border border-white/10 backdrop-blur-sm pointer-events-auto"
        style={{ isolation: 'isolate' }}
      >
        <button
          onClick={() => handleModeChange('vibe')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'vibe'
              ? 'bg-vault-gold/20 text-vault-gold border border-vault-gold/30'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Vibe Map
        </button>
        <button
          onClick={() => handleModeChange('niche')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'niche'
              ? 'bg-vault-gold/20 text-vault-gold border border-vault-gold/30'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Niche Map
        </button>
      </div>

      {/* Map — fills container exactly, no overflow */}
      <div className="absolute inset-0">
        {mode === 'vibe' ? <StarMap /> : <NicheMap />}
      </div>

      <FirstTimerBanner />
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
