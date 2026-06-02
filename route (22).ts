'use client'

import { useState } from 'react'
import { useVTubers } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'
import type { VTuber } from '@/lib/types'
import { ArrowRight, ArrowLeft, Star, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Quiz questions are editorial — the tag IDs in options are matched against
// whatever tags VTubers have in Supabase. Unknown/removed tag IDs simply score 0.
// To add a new question: add to QUESTIONS array with tag IDs from canonical_tags.
// To add a new answer option: include the relevant clust_*, vibe_*, or cont_* tag IDs.
interface Question {
  id: string
  text: string
  options: { label: string; emoji: string; tags: string[] }[]
}

const QUESTIONS: Question[] = [
  {
    id: 'energy',
    text: 'What kind of stream energy do you vibe with most?',
    options: [
      { label: 'Chaotic and unpredictable', emoji: '💥', tags: ['clust_chaos', 'vibe_chaotic', 'vibe_gremlin'] },
      { label: 'Chill and cozy', emoji: '🛋️', tags: ['clust_comfy', 'vibe_comfy', 'vibe_chill'] },
      { label: 'High energy hype', emoji: '🔥', tags: ['clust_variety', 'vibe_hype'] },
      { label: 'Deep lore and emotional', emoji: '🌙', tags: ['clust_menhara', 'vibe_menhara', 'vibe_lore'] },
    ],
  },
  {
    id: 'content',
    text: 'What content do you watch most?',
    options: [
      { label: 'Gaming', emoji: '🎮', tags: ['cont_gaming', 'cont_rpg', 'clust_gaming'] },
      { label: 'Just chatting / zatsudans', emoji: '🗣️', tags: ['vibe_zatsudan', 'cont_chatting', 'clust_variety'] },
      { label: 'Music and karaoke', emoji: '🎵', tags: ['clust_vsinger', 'cont_karaoke', 'vibe_original_music'] },
      { label: 'Art streams', emoji: '🎨', tags: ['cont_drawing', 'clust_creative'] },
    ],
  },
  {
    id: 'vibe',
    text: 'What draws you to a VTuber?',
    options: [
      { label: 'They feel like a genuine friend', emoji: '💛', tags: ['vibe_comfy', 'vibe_wholesome', 'clust_comfy'] },
      { label: 'Unhinged and unpredictable', emoji: '🌀', tags: ['vibe_gremlin', 'vibe_chaotic', 'clust_chaos'] },
      { label: 'Unique and niche taste', emoji: '🔭', tags: ['clust_denpa', 'vibe_denpa', 'clust_experimental'] },
      { label: 'Deep lore and worldbuilding', emoji: '📖', tags: ['vibe_lore', 'clust_menhara', 'vibe_chuuni'] },
    ],
  },
  {
    id: 'aesthetic',
    text: 'Pick a vibe:',
    options: [
      { label: 'Dark, glitchy, internet-poisoned', emoji: '📡', tags: ['clust_denpa', 'vibe_denpa', 'cont_horror'] },
      { label: 'Warm, soft, cottagecore', emoji: '🌸', tags: ['clust_comfy', 'vibe_comfy', 'vibe_asmr'] },
      { label: 'Loud, loud, LOUDER', emoji: '📢', tags: ['clust_chaos', 'vibe_hype', 'vibe_gremlin'] },
      { label: 'Creative and expressive', emoji: '✨', tags: ['clust_vsinger', 'cont_drawing', 'clust_creative'] },
    ],
  },
  {
    id: 'stream_time',
    text: 'When do you usually watch streams?',
    options: [
      { label: 'Late night, can\'t sleep', emoji: '🌃', tags: ['vibe_chill', 'vibe_asmr', 'clust_comfy'] },
      { label: 'Background noise while working', emoji: '💻', tags: ['vibe_zatsudan', 'vibe_comfy'] },
      { label: 'All day, I\'m a menace', emoji: '😈', tags: ['vibe_chaotic', 'vibe_hype', 'clust_chaos'] },
      { label: 'Specifically for events and premieres', emoji: '🎪', tags: ['clust_vsinger', 'vibe_hype'] },
    ],
  },
]

function scoreVTubers(answers: string[][], vtubers: VTuber[]): VTuber[] {
  // Build weight map from all selected tags
  const weights: Record<string, number> = {}
  answers.flat().forEach(tag => {
    weights[tag] = (weights[tag] ?? 0) + 1
  })

  // Score each vtuber
  const scored = vtubers.map(v => {
    const allTags = [v.category, ...v.vibeTags]
    const score = allTags.reduce((s, tag) => s + (weights[tag] ?? 0), 0)
    return { vtuber: v, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.vtuber)
}

export default function FindMyOshiPage() {
  const { vtubers } = useVTubers()
  const { constellations } = useStarMapData()
  const [step, setStep] = useState(0) // 0 = intro, 1-N = questions, N+1 = results
  const [answers, setAnswers] = useState<string[][]>([])
  const [selectedStr, setSelectedStr] = useState<string | null>(null)
  const [results, setResults] = useState<VTuber[]>([])

  const question = QUESTIONS[step - 1]
  const isIntro = step === 0
  const isDone = step > QUESTIONS.length

  const start = () => { setStep(1); setSelectedStr(null); setAnswers([]) }

  const next = () => {
    if (!selectedStr) return
    const selected = JSON.parse(selectedStr) as string[]
    const newAnswers = [...answers, selected]
    setAnswers(newAnswers)
    if (step >= QUESTIONS.length) {
      setResults(scoreVTubers(newAnswers, vtubers))
      setStep(step + 1)
    } else {
      setStep(step + 1)
      setSelectedStr(null)
    }
  }

  const back = () => {
    if (step <= 1) { setStep(0); return }
    setAnswers(prev => prev.slice(0, -1))
    setStep(step - 1)
    setSelectedStr(answers[step - 2] ? JSON.stringify(answers[step - 2]) : null)
  }

  const reset = () => { setStep(0); setAnswers([]); setSelectedStr(null); setResults([]) }

  const progress = step === 0 ? 0 : Math.min((step / QUESTIONS.length) * 100, 100)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-vault-cream flex items-center gap-2">
              <Star className="h-5 w-5 text-vault-gold" />
              Find My Oshi
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Personality-based VTuber matching</p>
          </div>
          {step > 0 && !isDone && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {step} / {QUESTIONS.length}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {step > 0 && !isDone && (
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-vault-gold transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">

          {/* Intro */}
          {isIntro && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">⭐</div>
              <div>
                <h2 className="text-2xl font-bold text-vault-cream mb-3">Who is your Oshi?</h2>
                <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                  Answer {QUESTIONS.length} quick questions about your streaming preferences and
                  we'll match you with VTubers from the Vault who fit your vibe.
                </p>
              </div>
              <Button
                onClick={start}
                className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold px-8 py-3 text-base"
              >
                Start Quiz <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Question */}
          {!isIntro && !isDone && question && (
            <div>
              <h2 className="text-xl font-bold text-vault-cream mb-6 text-center">{question.text}</h2>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {question.options.map(opt => {
                  const isChosen = selectedStr === JSON.stringify(opt.tags)
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedStr(JSON.stringify(opt.tags))}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isChosen
                          ? 'bg-vault-gold/15 border-vault-gold text-vault-cream shadow-lg scale-[1.02]'
                          : 'vault-card border-border text-muted-foreground hover:border-vault-bronze/50 hover:text-vault-cream'
                      }`}
                    >
                      <div className="text-2xl mb-2">{opt.emoji}</div>
                      <div className={`text-sm font-medium leading-snug ${isChosen ? 'text-vault-cream' : ''}`}>
                        {opt.label}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={back}
                  className="text-muted-foreground hover:text-vault-cream"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={next}
                  disabled={!selectedStr}
                  className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold disabled:opacity-40"
                >
                  {step >= QUESTIONS.length ? 'See Results' : 'Next'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Results */}
          {isDone && (
            <div>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🌟</div>
                <h2 className="text-2xl font-bold text-vault-cream mb-2">Your matches</h2>
                <p className="text-sm text-muted-foreground">
                  Based on your answers, these VTubers match your vibe the most.
                </p>
              </div>

              {results.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No matches found — the Vault needs more VTubers!
                </p>
              ) : (
                <div className="space-y-3 mb-8">
                  {results.map((vtuber, i) => {
                    const constellation = constellations.find(c => c.id === vtuber.category)
                    return (
                      <Link
                        key={vtuber.id}
                        href={`/vtuber/${vtuber.id}`}
                        className="vault-card rounded-xl p-4 flex items-center gap-4 hover:border-vault-gold/30 transition-all group"
                      >
                        {/* Rank */}
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          i === 0 ? 'bg-vault-gold text-vault-deep' :
                          i === 1 ? 'bg-vault-amber/70 text-vault-deep' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {i === 0 ? '★' : `#${i + 1}`}
                        </div>

                        {/* Avatar */}
                        <img
                          src={vtuber.avatarUrl}
                          alt={vtuber.name}
                          className="h-12 w-12 rounded-full border-2 border-vault-bronze/40 group-hover:border-vault-gold/50 transition-colors flex-shrink-0"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-vault-cream group-hover:text-vault-gold transition-colors truncate">
                              {vtuber.name}
                            </span>
                            {constellation && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full border flex-shrink-0"
                                style={{ borderColor: `${constellation.color}50`, color: constellation.color, background: `${constellation.color}15` }}
                              >
                                {constellation.name}
                              </span>
                            )}
                          </div>
                          {vtuber.bio && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{vtuber.bio}</p>
                          )}
                        </div>

                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-vault-gold transition-colors flex-shrink-0" />
                      </Link>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={reset}
                  className="flex-1 border-border text-vault-cream"
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Retake Quiz
                </Button>
                <Button
                  asChild
                  className="flex-1 bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold"
                >
                  <Link href="/discover">
                    <Star className="h-4 w-4 mr-2" /> Open Star Map
                  </Link>
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
