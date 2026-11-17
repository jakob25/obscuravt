'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useVTubers } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'
import type { VTuber } from '@/lib/types'
import { ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { scoreVTubers } from '@/lib/oshi-score'
import { QUESTIONS, decodeOshiAnswers, encodeOshiAnswers } from '@/lib/oshi-quiz'
import { OSHI_SHARE, oshiMatchBadge, oshiShareText } from '@/lib/site-copy'
import { ShareButton } from '@/components/common/share-button'

import { VaultPanel } from '@/components/vault/vault-surfaces'

export function FindMyOshiQuiz() {
  const { vtubers: rawVtubers } = useVTubers()
  // Stable order so ties score the same here and on the server share card
  const vtubers = useMemo(() => [...rawVtubers].sort((a, b) => a.id.localeCompare(b.id)), [rawVtubers])
  const { constellations } = useStarMapData()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0) // 0 = intro, 1-N = questions, N+1 = results
  const [answers, setAnswers] = useState<string[][]>([])
  const [answerIdx, setAnswerIdx] = useState<number[]>([])
  const [selectedStr, setSelectedStr] = useState<string | null>(null)
  const [results, setResults] = useState<VTuber[]>([])

  // A shared result link (?a=0,1,3,2,0) reopens the same matches
  const sharedRaw = searchParams.get('a')
  useEffect(() => {
    const decoded = decodeOshiAnswers(sharedRaw)
    if (!decoded || vtubers.length === 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore a shared result once data loads
    setAnswers(decoded.tags)
    setAnswerIdx(decoded.indexes)
    setResults(scoreVTubers(decoded.tags, vtubers))
    setStep(QUESTIONS.length + 1)
  }, [sharedRaw, vtubers])

  const question = QUESTIONS[step - 1]
  const isIntro = step === 0
  const isDone = step > QUESTIONS.length

  const start = () => { setStep(1); setSelectedStr(null); setAnswers([]); setAnswerIdx([]) }

  const next = () => {
    if (!selectedStr || !question) return
    const selected = JSON.parse(selectedStr) as string[]
    const newAnswers = [...answers, selected]
    const pickedIdx = question.options.findIndex(o => JSON.stringify(o.tags) === selectedStr)
    const newIdx = [...answerIdx, Math.max(0, pickedIdx)]
    setAnswers(newAnswers)
    setAnswerIdx(newIdx)
    if (step >= QUESTIONS.length) {
      setResults(scoreVTubers(newAnswers, vtubers))
      setStep(step + 1)
      // Put the answers in the address so the result link can be shared
      router.replace(`/find-my-oshi?a=${encodeOshiAnswers(newIdx)}`, { scroll: false })
    } else {
      setStep(step + 1)
      setSelectedStr(null)
    }
  }

  const back = () => {
    if (step <= 1) { setStep(0); return }
    setAnswers(prev => prev.slice(0, -1))
    setAnswerIdx(prev => prev.slice(0, -1))
    setStep(step - 1)
    setSelectedStr(answers[step - 2] ? JSON.stringify(answers[step - 2]) : null)
  }

  const reset = () => {
    setStep(0); setAnswers([]); setAnswerIdx([]); setSelectedStr(null); setResults([])
    if (sharedRaw) router.replace('/find-my-oshi', { scroll: false })
  }
  const sharePath = answerIdx.length === QUESTIONS.length ? `/find-my-oshi?a=${encodeOshiAnswers(answerIdx)}` : '/find-my-oshi'

  const progress = step === 0 ? 0 : Math.min((step / QUESTIONS.length) * 100, 100)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <div>
            <GlitchHeading as="h1" className="text-xl font-bold text-vault-cream">
              Find My Oshi
            </GlitchHeading>
            <p className="text-xs text-muted-foreground mt-0.5">Vibe quiz. No follower counts.</p>
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
              <div>
                <h2 className="text-2xl font-bold text-vault-cream mb-3">Who is your Oshi?</h2>
                <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {QUESTIONS.length} questions. We match you to creators the algorithm doesn&apos;t want you to see — by vibe, not clout.
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
                      <div className="text-2xl mb-2 font-mono text-vault-gold">{opt.symbol}</div>
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
                <h2 className="text-2xl font-bold text-vault-cream mb-2">{OSHI_SHARE.resultHeading}</h2>
                <p className="text-sm text-muted-foreground">
                  Your vibe, their dossier. Go say hi.
                </p>
                {results.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <ShareButton
                      path={sharePath}
                      title={oshiShareText(results[0].name)}
                      label={OSHI_SHARE.shareLabel}
                      ariaLabel={`${OSHI_SHARE.shareLabel}: share or copy the link to these results`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-vault-gold/60 bg-vault-gold/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-vault-gold hover:bg-vault-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.97]"
                    />
                    <a
                      href={`https://x.com/intent/post?text=${encodeURIComponent(oshiShareText(results[0].name))}&url=${encodeURIComponent(typeof window !== 'undefined' ? new URL(sharePath, window.location.origin).toString() : sharePath)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-vault-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Post on X
                    </a>
                  </div>
                )}
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
                        className="block group"
                    >
                      <VaultPanel className="p-4 flex items-center gap-4 hover:border-vault-gold/30 transition-all"
                      >
                        {/* Quiz match number (how well your answers fit), not a creator ranking */}
                        <div aria-label={oshiMatchBadge(i)} className={`flex-shrink-0 h-8 min-w-[4.5rem] px-2 rounded-full flex items-center justify-center font-bold text-[10px] tracking-wider ${
                          i === 0 ? 'bg-vault-gold text-vault-deep' :
                          i === 1 ? 'bg-vault-amber/70 text-vault-deep' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {oshiMatchBadge(i)}
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
                      </VaultPanel>
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
                  <Link href="/discover">Open Star Map</Link>
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
