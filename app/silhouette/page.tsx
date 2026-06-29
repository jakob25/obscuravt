'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useStarMapData } from '@/hooks/use-star-map-data'
import { RotateCcw, ArrowRight, Check, X, User, Trophy, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultPanel } from '@/components/vault/vault-surfaces'
import { shuffle } from '@/lib/discovery-games'

interface SilhouetteEntry {
  id: string
  name: string
  bio: string
  category: string
  displayUrl: string
  source: 'uploaded' | 'avatar_fallback'
}

function SilhouetteImage({ entry, revealed }: { entry: SilhouetteEntry; revealed: boolean }) {
  const isFallback = entry.source === 'avatar_fallback' && !revealed
  return (
    <div className="relative">
      <img
        src={entry.displayUrl}
        alt="Mystery VTuber"
        className={`h-40 w-40 rounded-full border-4 transition-all duration-500 object-cover ${
          revealed ? 'filter-none border-vault-gold/60' : 'border-muted'
        }`}
        style={isFallback ? { filter: 'brightness(0) saturate(0)' } : undefined}
      />
      {!revealed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-4xl opacity-20">?</span>
        </div>
      )}
      {!revealed && entry.source === 'uploaded' && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-vault-gold/80 whitespace-nowrap">
          Custom silhouette
        </span>
      )}
    </div>
  )
}

export default function SilhouettePage() {
  const { constellations } = useStarMapData()
  const [pool, setPool] = useState<SilhouetteEntry[]>([])
  const [stats, setStats] = useState({ withSilhouette: 0, preferUploaded: false })
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<SilhouetteEntry | null>(null)
  const [choices, setChoices] = useState<SilhouetteEntry[]>([])
  const [revealed, setRevealed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const MAX_ROUNDS = 10

  const newRound = (source: SilhouetteEntry[]) => {
    if (source.length < 4) return
    const shuffled = shuffle(source)
    const answer = shuffled[0]
    const wrong = shuffled.slice(1, 4)
    setCurrent(answer)
    setChoices(shuffle([answer, ...wrong]))
    setRevealed(false)
    setSelected(null)
  }

  useEffect(() => {
    fetch('/api/discovery-games/silhouette')
      .then(r => r.ok ? r.json() : { pool: [], stats: {} })
      .then(data => {
        const entries: SilhouetteEntry[] = data.pool ?? []
        setPool(entries)
        setStats({
          withSilhouette: data.stats?.withSilhouette ?? 0,
          preferUploaded: data.stats?.preferUploaded ?? false,
        })
        if (entries.length >= 4) newRound(entries)
      })
      .catch(() => setPool([]))
      .finally(() => setLoading(false))
  }, [])

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
    newRound(pool)
  }

  const restart = () => {
    setScore(0); setRound(0); setGameOver(false)
    newRound(pool)
  }

  const constellation = current ? constellations.find(c => c.id === current.category) : null

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <User className="h-10 w-10 text-vault-gold mx-auto mb-3 animate-pulse" />
          <p className="text-muted-foreground animate-pulse">Loading silhouettes…</p>
        </div>
      </div>
    )
  }

  if (pool.length < 4) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <GlitchHeading as="h1" className="text-xl font-bold text-vault-cream mb-4">Who is this VTuber?</GlitchHeading>
        <p className="text-sm text-muted-foreground mb-4">
          Need at least four dossiers with avatars or uploaded silhouettes in the archive.
        </p>
        <Button asChild className="bg-vault-gold text-vault-deep">
          <Link href="/discover">Explore Star Map</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-border px-4 py-4">
        <div className="container mx-auto max-w-lg flex items-center justify-between">
          <GlitchHeading as="h1" className="text-xl font-bold text-vault-cream">
            Who is this VTuber?
          </GlitchHeading>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{round + 1}/{MAX_ROUNDS}</span>
            <span className="font-bold text-vault-gold">Score: {score}</span>
          </div>
        </div>
        {stats.preferUploaded && (
          <p className="container mx-auto max-w-lg text-[10px] text-vault-gold/80 mt-1">
            {stats.withSilhouette} custom silhouettes in rotation
          </p>
        )}
      </div>

      <div className="container mx-auto max-w-lg px-4 py-8">
        {gameOver ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {score >= 8 ? (
                <Trophy className="h-12 w-12 text-vault-gold" />
              ) : score >= 5 ? (
                <Target className="h-12 w-12 text-vault-amber" />
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-vault-cream mb-2">
                {score}/{MAX_ROUNDS} correct
              </h2>
              <p className="text-muted-foreground">
                {score >= 8 ? 'Strong score.' :
                 score >= 5 ? 'Not bad. Try Discover next.' :
                 'Browse Discover to learn the roster.'}
              </p>
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={restart} variant="outline" className="border-border text-vault-cream gap-2">
                <RotateCcw className="h-4 w-4" /> Play again
              </Button>
              <Button asChild variant="outline" className="border-vault-bronze/40">
                <Link href="/crane">Vault Crane</Link>
              </Button>
              <Button asChild className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold gap-2">
                <Link href="/discover">Explore Star Map</Link>
              </Button>
            </div>
          </div>
        ) : current ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <SilhouetteImage entry={current} revealed={revealed} />
            </div>

            {revealed && (
              <VaultPanel className="p-4 text-center">
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
              </VaultPanel>
            )}

            <div className="grid grid-cols-2 gap-3">
              {choices.map(v => {
                const isSelected = selected === v.id
                const isCorrect = v.id === current.id
                const showResult = revealed

                return (
                  <button
                    key={v.id}
                    type="button"
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
                    <span className="text-xs text-muted-foreground line-clamp-1">{v.bio}</span>
                  </button>
                )
              })}
            </div>

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