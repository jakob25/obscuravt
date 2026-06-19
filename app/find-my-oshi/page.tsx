'use client'

import { useState } from 'react'
import { useVTubers } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'
import type { VTuber } from '@/lib/types'
import { ArrowRight, ArrowLeft, Star, RotateCcw } from 'lucide-react'

export default function FindMyOshiPage() {
  const { vtubers, loading } = useVTubers()
  const { constellations } = useStarMapData()

  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [selectedConstellation, setSelectedConstellation] = useState<string>('')
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  const vibeOptions = ['wholesome', 'chaotic', 'unhinged', 'cozy', 'competitive', 'artistic', 'meme', 'chill']

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev =>
      prev.includes(vibe)
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe]
    )
  }

  const findMatches = () => {
    if (!vtubers.length) return

    const weights: Record<string, number> = {}

    // Give weight to selected vibes
    selectedVibes.forEach(vibe => {
      weights[vibe] = 3
    })

    // Give weight to selected constellation
    if (selectedConstellation) {
      weights[selectedConstellation] = 5
    }

    // Score each vtuber
    const scored = vtubers.map(v => {
      const allTags = [v.category || '', ...(v.vibeTags || [])]
      const score = allTags.reduce((s, tag) => s + (weights[tag] ?? 0), 0)
      return { vtuber: v, score }
    })

    // Sort by score descending
    const sorted = scored.sort((a, b) => b.score - a.score)

    setResults(sorted.slice(0, 12))
    setShowResults(true)
  }

  const reset = () => {
    setSelectedVibes([])
    setSelectedConstellation('')
    setResults([])
    setShowResults(false)
  }

  if (loading) {
    return <div className="p-8 text-center">Loading VTubers...</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Find Your Oshi</h1>
        <p className="text-white/70">Tell us what you like and we\'ll suggest VTubers for you.</p>
      </div>

      {!showResults ? (
        <div className="space-y-8">
          {/* Constellation Selection */}
          <div>
            <h3 className="font-semibold mb-3">Preferred Constellation (optional)</h3>
            <div className="flex flex-wrap gap-2">
              {constellations.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedConstellation(c.id)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${
                    selectedConstellation === c.id
                      ? 'bg-vault-gold text-vault-deep border-vault-gold'
                      : 'border-white/20 hover:bg-white/5'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Vibe Tags */}
          <div>
            <h3 className="font-semibold mb-3">What kind of energy do you like? (select multiple)</h3>
            <div className="flex flex-wrap gap-2">
              {vibeOptions.map(vibe => (
                <button
                  key={vibe}
                  onClick={() => toggleVibe(vibe)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${
                    selectedVibes.includes(vibe)
                      ? 'bg-vault-gold text-vault-deep border-vault-gold'
                      : 'border-white/20 hover:bg-white/5'
                  }`}
                >
                  {vibe}
                </button>
              ))}
            </div>
            {selectedVibes.length > 0 && (
              <p className="text-sm text-white/60 mt-2">Selected: {selectedVibes.join(', ')}</p>
            )}
          </div>

          <button
            onClick={findMatches}
            className="w-full py-4 bg-vault-gold text-vault-deep rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-[#e8bc5a] transition-colors"
          >
            Find My Oshi <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Your Matches</h2>
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" /> Start Over
            </button>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              No strong matches found. Try different vibes.
            </div>
          ) : (
            <div className="space-y-4">
              {results.map(({ vtuber, score }) => (
                <a
                  key={vtuber.id}
                  href={`/vtuber/${vtuber.id}`}
                  className="block vault-card p-5 hover:border-vault-gold/30 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg">{vtuber.name}</div>
                      {vtuber.handle && <div className="text-sm text-white/60">{vtuber.handle}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-vault-gold font-mono text-lg">{score}</div>
                      <div className="text-xs text-white/50">match score</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
