'use client'

import { useState, useEffect } from 'react'
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
    <div className="absolute bottom-16 left-4 right-4 z-20 max-w-md">
      <div className="bg-black/80 border border-cyan-400/20 rounded-xl px-4 py-3 backdrop-blur-sm flex items-start gap-3">
        <span className="text-lg flex-shrink-0">👋</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Scroll to zoom in — click any cluster to explore it.</p>
          <p className="text-xs text-white/50 mt-0.5">Constellations are personality types, not genres.</p>
        </div>
        <button
          onClick={() => { setShow(false); localStorage.setItem('vtvault_map_seen', '1') }}
          className="text-xs text-white/40 hover:text-white flex-shrink-0 mt-0.5"
        >✕</button>
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  const [mode, setMode] = useState<MapMode>('vibe')

  return (
    <div className="relative w-full flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Compact floating toggle — sits on top of the map, not above it */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-1 p-1 rounded-xl bg-black/70 border border-white/10 backdrop-blur-sm">
        <button
          onClick={() => setMode('vibe')}
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
          onClick={() => setMode('niche')}
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

      {/* Map fills everything */}
      <div className="flex-1 relative">
        {mode === 'vibe' ? <StarMap /> : <NicheMap />}
        <FirstTimerBanner />
      </div>
    </div>
  )
}
