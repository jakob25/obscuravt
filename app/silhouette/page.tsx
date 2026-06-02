'use client'

import { useState, useEffect } from 'react'
import { useVTubers } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'
import type { VTuber } from '@/lib/types'
import { Eye, RotateCcw, ArrowRight, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function SilhouettePage() {
  const { vtubers, loading } = useVTubers()
  const { constellations } = useStarMapData()
  const [current, setCurrent] = useState<VTuber | null>(null)
  const [choices, setChoices] = useState<VTuber[]>([])
  const [revealed, setRevealed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const MAX_ROUNDS = 10

  const newRound = (pool: VTuber[]) => {
    if (pool.length < 4) return
    const shuffled = shuffle(pool)
    const answer = shuffled[0]
    const wrong = shuffled.slice(1, 4)
    setCurrent(answer)
    setChoices(shuffle([answer, ...wrong]))
    setRevealed(false)
    setSelected(null)
  }

  useEffect(() => {
    if (!loading && vtubers.length >= 4) newRound(vtubers)
  }, [loading, vtubers])

  const guess = (vtuberId: string) => {
    if (selected) return
    setSelected(vtuberId)
    setRevealed(true)
    if (vtuberId === current?.id) setScore(s => s + 1)
  }

  const next = () => {
    const nextRound = round + 1
    if (nextRound >= MAX_ROUNDS) { setGameOver(true); return }
    setRound(nextRound)
    newRound(vtubers)
  }

  const restart = () => {
    setScore(0); setRound(0); setGameOver(false)
    newRound(vtubers)
  }

  const constellation = current ? constellations.find(c => c.id === current.category) : null

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">👤</div>
          <p className="text-muted-foreground animate-pulse">Loading VTubers…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-4 py-4">
        <div className="container mx-auto max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-vault-gold" />
            <h1 className="text-xl font-bold text-vault-cream">Who is this VTuber?</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{round + 1}/{MAX_ROUNDS}</span>
            <span className="font-bold text-vault-gold">Score: {score}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-lg px-4 py-8">
        {gameOver ? (
          <div className="text-center space-y-6">
            <div className="text-5xl">{score >= 8 ? '🏆' : score >= 5 ? '👍' : '😅'}</div>
            <div>
              <h2 className="text-2xl font-bold text-vault-cream mb-2">
                {score}/{MAX_ROUNDS} correct
              </h2>
              <p className="text-muted-foreground">
                {score >= 8 ? 'You really know your VTubers!' :
                 score >= 5 ? 'Not bad, keep exploring!' :
                 'Time to do some research on the Star Map…'}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={restart} variant="outline" className="border-border text-vault-cream gap-2">
                <RotateCcw className="h-4 w-4" /> Play again
              </Button>
              <Button asChild className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold gap-2">
                <Link href="/discover"><Eye className="h-4 w-4" /> Explore Star Map</Link>
              </Button>
            </div>
          </div>
        ) : current ? (
          <div className="space-y-6">
            {/* Silhouette / revealed avatar */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={current.avatarUrl}
                  alt="Mystery VTuber"
                  className={`h-40 w-40 rounded-full border-4 transition-all duration-500 ${
                    revealed
                      ? 'filter-none border-vault-gold/60'
                      : 'brightness-0 border-muted'
                  }`}
                  style={revealed ? {} : { filter: 'brightness(0) saturate(0)' }}
                />
                {!revealed && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl opacity-20">?</span>
                  </div>
                )}
              </div>
            </div>

            {/* Revealed info */}
            {revealed && current && (
              <div className="vault-card rounded-xl p-4 text-center">
                <h2 className="font-bold text-vault-cream text-lg mb-1">{current.name}</h2>
                {constellation && (
                  <span className="text-xs px-2 py-0.5 rounded-full border"
                    style={{ borderColor: `${constellation.color}50`, color: constellation.color, background: `${constellation.color}15` }}>
                    {constellation.name}
                </span>
                )}
                {current.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{current.bio}</p>}
                <Link href={`/vtuber/${current.id}`} className="text-xs text-vault-gold hover:underline mt-2 inline-block">
                  View full profile →
                </Link>
              </div>
            )}

            {/* Choices */}
            <div className="grid grid-cols-2 gap-3">
              {choices.map(v => {
                const isSelected = selected === v.id
                const isCorrect = v.id === current.id
                const showResult = revealed

                return (
                  <button
                    key={v.id}
                    onClick={() => guess(v.id)}
                    disabled={!!selected}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      !selected
                        ? 'border-border hover:border-vault-gold/40 hover:bg-vault-gold/5 cursor-pointer'
                        : showResult && isCorrect
                          ? 'border-green-500 bg-green-500/10'
                          : showResult && isSelected && !isCorrect
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-border opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-vault-cream text-sm">{v.name}</span>
                      {showResult && isCorrect && <Check className="h-4 w-4 text-green-400" />}
                      {showResult && isSelected && !isCorrect && <X className="h-4 w-4 text-red-400" />}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1">{v.bio ?? ''}</span>
                  </button>
                )
              })}
            </div>

            {/* Next button */}
            {revealed && (
              <Button
                onClick={next}
                className="w-full bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold gap-2"
              >
                {round + 1 >= MAX_ROUNDS ? 'See Results' : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
