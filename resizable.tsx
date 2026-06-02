'use client'

import { useState, useCallback } from 'react'
import { useBets } from '@/hooks/use-data'
import { useAuth } from '@/lib/auth-context'
import { Trophy, Clock, TrendingUp, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Vote } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Bet, BetOption } from '@/lib/types'

// ── Per-bet interactive card ──────────────────────────────────────────────────

function BetCard({ bet, onUpdate }: { bet: Bet; onUpdate: () => void }) {
  const { user, refreshUser } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState<'place' | 'vote' | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [amount, setAmount] = useState('100')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null)

  const total = bet.options.reduce((s, o) => s + o.totalScraps, 0)
  const isOpen = bet.status === 'open'
  const isClosed = bet.status === 'closed'

  const showFeedback = (text: string, ok: boolean) => {
    setFeedback({ text, ok })
    setTimeout(() => setFeedback(null), 3500)
  }

  const placeBet = async () => {
    if (!user || !selectedOption) return
    const amt = parseInt(amount)
    if (!amt || amt < 1) { showFeedback('Enter a valid amount.', false); return }
    if (amt > user.coins) { showFeedback(`Not enough coins. You have ${user.coins.toLocaleString()}.`, false); return }

    setLoading(true)
    const res = await fetch('/api/bets/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet_id: bet.id, username: user.username, option: selectedOption, amount: amt }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { showFeedback(data.error ?? 'Failed to place bet.', false); return }

    showFeedback(`Bet placed! ${amt.toLocaleString()} scraps on "${selectedOption}"`, true)
    setMode(null)
    setSelectedOption(null)
    await refreshUser()
    onUpdate()
  }

  const castVote = async () => {
    if (!user || !selectedOption) return
    setLoading(true)
    const res = await fetch('/api/bets/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet_id: bet.id, username: user.username, option: selectedOption }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { showFeedback(data.error ?? 'Failed to vote.', false); return }

    if (data.resolved) {
      showFeedback(`Your vote resolved the bet! Winner: "${selectedOption}"`, true)
    } else {
      showFeedback(`Vote cast for "${selectedOption}"`, true)
    }
    setMode(null)
    setSelectedOption(null)
    onUpdate()
  }

  return (
    <div className="vault-card rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-vault-cream text-sm leading-snug">{bet.title}</h3>
          <Badge className={`text-xs shrink-0 ${
            isOpen ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            isClosed ? 'bg-vault-gold/20 text-vault-gold border-vault-gold/30' :
            'bg-muted text-muted-foreground'
          }`}>
            {bet.status}
          </Badge>
        </div>

        {bet.description && (
          <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{bet.description}</p>
        )}

        {/* Options with progress bars */}
        <div className="space-y-2 mb-4">
          {bet.options.map(opt => {
            const pct = total > 0 ? Math.round((opt.totalScraps / total) * 100) : 0
            const isSelected = selectedOption === opt.label
            const isClickable = mode !== null

            return (
              <button
                key={opt.id}
                onClick={() => isClickable && setSelectedOption(isSelected ? null : opt.label)}
                disabled={!isClickable}
                className={`w-full text-left transition-all rounded-lg ${
                  isClickable ? 'cursor-pointer hover:bg-vault-bronze/10' : 'cursor-default'
                } ${isSelected ? 'ring-1 ring-vault-gold bg-vault-gold/5 rounded-lg p-1 -m-1' : ''}`}
              >
                <div className="flex justify-between text-xs mb-1 px-1">
                  <span className={`font-medium ${isSelected ? 'text-vault-gold' : 'text-vault-cream'}`}>
                    {isSelected && '✓ '}{opt.label}
                  </span>
                  <span className="text-muted-foreground">
                    {pct}% · {opt.totalScraps.toLocaleString()} scraps
                  </span>
                </div>
                <Progress
                  value={pct}
                  className={`h-1.5 ${isSelected ? 'bg-vault-gold/20' : ''}`}
                />
              </button>
            )
          })}
        </div>

        {/* Pool + timestamp */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span className="text-vault-gold font-medium">{total.toLocaleString()} total scraps</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(bet.endsAt).toLocaleDateString()}
          </span>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs mb-3 ${
            feedback.ok
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-destructive/10 border border-destructive/20 text-destructive'
          }`}>
            {feedback.ok
              ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
              : <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            }
            {feedback.text}
          </div>
        )}

        {/* Action buttons */}
        {user && (
          <div className="flex gap-2">
            {isOpen && (
              <Button
                size="sm"
                onClick={() => { setMode(mode === 'place' ? null : 'place'); setSelectedOption(null) }}
                className={`flex-1 text-xs font-semibold ${
                  mode === 'place'
                    ? 'bg-vault-gold text-vault-deep'
                    : 'bg-vault-gold/20 hover:bg-vault-gold/30 text-vault-gold border border-vault-gold/30'
                }`}
              >
                <Trophy className="h-3.5 w-3.5 mr-1" />
                {mode === 'place' ? 'Cancel' : 'Place Bet'}
              </Button>
            )}
            {(isOpen || isClosed) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setMode(mode === 'vote' ? null : 'vote'); setSelectedOption(null) }}
                className={`flex-1 text-xs border-vault-bronze/40 text-vault-cream hover:bg-vault-bronze/10 ${
                  mode === 'vote' ? 'border-vault-gold/50 bg-vault-bronze/10' : ''
                }`}
              >
                <Vote className="h-3.5 w-3.5 mr-1" />
                {mode === 'vote' ? 'Cancel' : 'Vote Outcome'}
              </Button>
            )}
          </div>
        )}

        {!user && (isOpen || isClosed) && (
          <p className="text-xs text-muted-foreground text-center">
            <a href="/login" className="text-vault-gold hover:underline">Sign in</a> to place bets and vote
          </p>
        )}
      </div>

      {/* Expanded interaction panel */}
      {mode === 'place' && (
        <div className="border-t border-border bg-muted/20 px-5 py-4">
          <p className="text-xs text-muted-foreground mb-3">
            Select an option above, then enter your wager.
            <span className="text-vault-gold ml-1">Balance: {user?.coins.toLocaleString()} scraps</span>
          </p>
          <div className="flex gap-2 mb-3">
            {/* Quick amounts */}
            {[50, 100, 250, 500].map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(String(amt))}
                className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                  amount === String(amt)
                    ? 'bg-vault-gold/20 border-vault-gold/50 text-vault-gold'
                    : 'border-border text-muted-foreground hover:border-vault-bronze/50'
                }`}
              >
                {amt}
              </button>
            ))}
            <button
              onClick={() => setAmount(String(user?.coins ?? 0))}
              className="px-2.5 py-1 rounded text-xs border border-border text-muted-foreground hover:border-vault-bronze/50 transition-colors"
            >
              All in
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount..."
              className="bg-muted/30 border-border text-vault-cream text-sm h-9"
            />
            <Button
              size="sm"
              onClick={placeBet}
              disabled={!selectedOption || loading}
              className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold h-9 px-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
            </Button>
          </div>
          {!selectedOption && (
            <p className="text-xs text-vault-gold/70 mt-2">← Select an option above first</p>
          )}
        </div>
      )}

      {mode === 'vote' && (
        <div className="border-t border-border bg-muted/20 px-5 py-4">
          <p className="text-xs text-muted-foreground mb-3">
            What actually happened? Select the correct outcome and submit your vote.
            When enough votes agree, the bet resolves automatically.
          </p>
          <Button
            size="sm"
            onClick={castVote}
            disabled={!selectedOption || loading}
            className="w-full bg-vault-bronze/30 hover:bg-vault-bronze/50 text-vault-cream border border-vault-bronze/40 disabled:opacity-50"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : <Vote className="h-4 w-4 mr-2" />
            }
            {selectedOption ? `Vote: "${selectedOption}"` : 'Select an option above'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BetsPage() {
  const { bets, loading } = useBets()
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  const openBets = bets.filter(b => b.status === 'open')
  const closedBets = bets.filter(b => b.status === 'closed')
  const resolvedBets = bets.filter(b => b.status === 'resolved')

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-vault-gold" />
          <h1 className="text-2xl font-bold text-vault-cream">VTuberBets</h1>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="vault-card rounded-xl p-5 h-52 animate-pulse bg-muted/20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="h-6 w-6 text-vault-gold" />
        <h1 className="text-2xl font-bold text-vault-cream">VTuberBets</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Spend scraps predicting what happens on stream. Vote on outcomes to resolve bets and earn your share.
      </p>

      {bets.length === 0 && (
        <p className="text-muted-foreground text-center py-20">
          No bets yet — use the + button to create one!
        </p>
      )}

      {/* Open bets */}
      {openBets.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-vault-cream mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-vault-gold" />
            Open Bets
            <span className="text-xs font-normal text-muted-foreground">({openBets.length})</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {openBets.map(bet => (
              <BetCard key={`${bet.id}-${refreshKey}`} bet={bet} onUpdate={refresh} />
            ))}
          </div>
        </section>
      )}

      {/* Needs voting */}
      {closedBets.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-vault-cream mb-2 flex items-center gap-2">
            <Vote className="h-4 w-4 text-vault-gold" />
            Needs Your Vote
            <span className="text-xs font-normal text-muted-foreground">({closedBets.length})</span>
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            These bets have ended — vote on what actually happened to trigger resolution.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {closedBets.map(bet => (
              <BetCard key={`${bet.id}-${refreshKey}`} bet={bet} onUpdate={refresh} />
            ))}
          </div>
        </section>
      )}

      {/* Resolved */}
      {resolvedBets.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-vault-cream mb-4 text-muted-foreground">
            Resolved ({resolvedBets.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4 opacity-60">
            {resolvedBets.map(bet => (
              <div key={bet.id} className="vault-card rounded-xl p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-vault-cream text-sm">{bet.title}</h3>
                  <Badge variant="secondary" className="text-xs shrink-0">Resolved</Badge>
                </div>
                {bet.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{bet.description}</p>
                )}
                <div className="space-y-1.5">
                  {bet.options.map(opt => {
                    const total = bet.options.reduce((s, o) => s + o.totalScraps, 0)
                    const pct = total > 0 ? Math.round((opt.totalScraps / total) * 100) : 0
                    return (
                      <div key={opt.id}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-vault-cream">{opt.label}</span>
                          <span className="text-muted-foreground">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1" />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
