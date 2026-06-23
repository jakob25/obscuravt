'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Trophy, Vote, Loader2, Plus } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import type { StreamPrediction } from '@/lib/stream-predictions'

interface Props {
  vtuberId: string
  vtuberName: string
  isOwner: boolean
}

export function StreamPredictions({ vtuberId, vtuberName, isOwner }: Props) {
  const { user, refreshUser } = useAuth()
  const [predictions, setPredictions] = useState<StreamPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [optA, setOptA] = useState('Yes')
  const [optB, setOptB] = useState('No')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [mode, setMode] = useState<Record<string, 'place' | 'vote' | null>>({})
  const [selected, setSelected] = useState<Record<string, string | null>>({})
  const [amount, setAmount] = useState('100')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/stream-predictions?vtuberId=${encodeURIComponent(vtuberId)}`)
    const data = await res.json()
    setPredictions(data.predictions ?? [])
    setLoading(false)
  }, [vtuberId])

  useEffect(() => { load() }, [load])

  const createPrediction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner || !title.trim()) return
    setError('')
    const res = await fetch('/api/stream-predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ vtuberId, title, options: [optA, optB] }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to create prediction.'); return }
    setTitle(''); setShowForm(false); load()
  }

  const placeBet = async (betId: string) => {
    if (!user || !selected[betId]) return
    const amt = parseInt(amount, 10)
    if (!amt || amt < 1) return
    setBusyId(betId)
    const res = await fetch('/api/bets/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bet_id: betId, option: selected[betId], amount: amt }),
    })
    setBusyId(null)
    if (res.ok) {
      setMode(m => ({ ...m, [betId]: null }))
      setSelected(s => ({ ...s, [betId]: null }))
      await refreshUser()
      load()
    }
  }

  const castVote = async (betId: string) => {
    if (!user || !selected[betId]) return
    setBusyId(betId)
    await fetch('/api/bets/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bet_id: betId, option: selected[betId] }),
    })
    setBusyId(null)
    setMode(m => ({ ...m, [betId]: null }))
    setSelected(s => ({ ...s, [betId]: null }))
    load()
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Predict what happens on {vtuberName}&apos;s next stream. Wager scraps, vote outcomes — same odds as VTuberBets.
      </p>

      {isOwner && (
        <>
          <button
            type="button"
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-vault-gold/40 text-vault-gold text-xs font-semibold hover:bg-vault-gold/10 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> New prediction
          </button>
          {showForm && (
            <form onSubmit={createPrediction} className="space-y-2 p-3 rounded-lg border border-border/60 bg-muted/20">
              {error && <p className="text-xs text-red-400">{error}</p>}
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder='e.g. "Will they beat the boss tonight?"'
                required
                className="w-full h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
              />
              <div className="flex gap-2">
                <input value={optA} onChange={e => setOptA(e.target.value)} className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream" />
                <input value={optB} onChange={e => setOptB(e.target.value)} className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream" />
              </div>
              <button type="submit" className="h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold cursor-pointer">Post</button>
            </form>
          )}
        </>
      )}

      {loading && <p className="text-xs text-muted-foreground animate-pulse">Loading predictions…</p>}

      {!loading && predictions.length === 0 && (
        <p className="text-xs text-muted-foreground">No stream predictions yet.</p>
      )}

      {predictions.map(p => {
        const total = p.options.reduce((s, o) => s + o.totalScraps, 0)
        const activeMode = mode[p.id] ?? null
        const sel = selected[p.id] ?? null
        const isOpen = p.status === 'open'

        return (
          <div key={p.id} className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-vault-cream">{p.title}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground shrink-0">{p.status}</span>
            </div>

            <div className="space-y-1.5">
              {p.options.map(opt => {
                const pct = total > 0 ? Math.round((opt.totalScraps / total) * 100) : 0
                const isSel = sel === opt.label
                const clickable = activeMode !== null
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && setSelected(s => ({ ...s, [p.id]: isSel ? null : opt.label }))}
                    className={`w-full text-left rounded-lg px-1 py-0.5 transition-all cursor-pointer disabled:cursor-default ${
                      isSel ? 'ring-1 ring-vault-gold bg-vault-gold/5' : clickable ? 'hover:bg-vault-bronze/10' : ''
                    }`}
                  >
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className={isSel ? 'text-vault-gold font-medium' : 'text-vault-cream'}>{opt.label}</span>
                      <span className="text-muted-foreground">{pct}% · {opt.totalScraps.toLocaleString()}</span>
                    </div>
                    <Progress value={pct} className="h-1" />
                  </button>
                )
              })}
            </div>

            {user && isOpen && (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode(m => ({ ...m, [p.id]: activeMode === 'place' ? null : 'place' }))}
                  className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-xs font-semibold border border-vault-gold/30 text-vault-gold hover:bg-vault-gold/10 cursor-pointer"
                >
                  <Trophy className="h-3.5 w-3.5" /> Wager
                </button>
                <button
                  type="button"
                  onClick={() => setMode(m => ({ ...m, [p.id]: activeMode === 'vote' ? null : 'vote' }))}
                  className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-xs font-semibold border border-border text-vault-cream hover:bg-muted/40 cursor-pointer"
                >
                  <Vote className="h-3.5 w-3.5" /> Vote
                </button>
              </div>
            )}

            {activeMode === 'place' && (
              <div className="flex gap-2">
                <Input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} className="h-8 text-sm bg-muted/30" />
                <button
                  type="button"
                  disabled={!sel || busyId === p.id}
                  onClick={() => placeBet(p.id)}
                  className="h-8 px-3 rounded-lg bg-vault-gold text-vault-deep text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {busyId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm'}
                </button>
              </div>
            )}

            {activeMode === 'vote' && (
              <button
                type="button"
                disabled={!sel || busyId === p.id}
                onClick={() => castVote(p.id)}
                className="w-full h-8 rounded-lg border border-vault-bronze/40 text-vault-cream text-xs font-medium disabled:opacity-50 cursor-pointer"
              >
                {sel ? `Vote: "${sel}"` : 'Select an outcome above'}
              </button>
            )}

            {p.status === 'closed' && p.result && (
              <p className="text-xs text-vault-gold">Resolved: {p.result}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}