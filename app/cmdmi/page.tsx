'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { normalizeRole } from '@/lib/roles'
import { ThumbsUp, Target, Coins } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'

interface Goal {
  id: string
  goal_amount: number
  funded_amount: number
  status: string
}

interface Idea {
  id: string
  profile_id: string
  submitted_by: string
  title: string
  description: string
  upvotes: number
  status: string
  goal: Goal | null
}

function CmdmiPageContent() {
  const { user, refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const profileId = searchParams.get('profile') ?? ''

  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pledgeAmount, setPledgeAmount] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  const isOwner = normalizeRole(user?.role ?? null) === 'VTuber' && !!profileId

  const load = useCallback(async () => {
    setLoading(true)
    const url = profileId ? `/api/cmdmi?profileId=${encodeURIComponent(profileId)}` : '/api/cmdmi'
    const res = await fetch(url)
    const data = await res.json()
    setIdeas(data.ideas ?? [])
    setLoading(false)
  }, [profileId])

  useEffect(() => { load() }, [load])

  const submitIdea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profileId) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/cmdmi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, title, description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTitle(''); setDescription('')
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const upvote = async (ideaId: string) => {
    if (!user || busyId) return
    setBusyId(ideaId)
    await fetch('/api/cmdmi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upvote', ideaId }),
    })
    await load()
    setBusyId(null)
  }

  const setGoal = async (ideaId: string) => {
    const amount = prompt('Set a scraps goal for this idea:')
    if (!amount || isNaN(Number(amount))) return
    setBusyId(ideaId)
    await fetch('/api/cmdmi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_goal', ideaId, goalAmount: Number(amount) }),
    })
    await load()
    setBusyId(null)
  }

  const pledge = async (goalId: string) => {
    const amount = Number(pledgeAmount[goalId] ?? 0)
    if (!user || !amount || amount <= 0 || busyId) return
    setBusyId(goalId)
    const res = await fetch('/api/cmdmi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pledge', goalId, amount }),
    })
    const data = await res.json()
    if (res.ok) {
      await refreshUser()
      setPledgeAmount(p => ({ ...p, [goalId]: '' }))
      if (data.goal_met) alert('Goal met — this stream is happening.')
    }
    await load()
    setBusyId(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <PageBackNav fallbackHref={profileId ? `/vtuber/${profileId}` : '/discover'} />
      <div className="mb-6">
        <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-1">
          Chat Made Me Do It
        </GlitchHeading>
        <p className="text-muted-foreground text-sm">
          Chat pitches the chaos. Creator picks one. Pledge scraps — goal met, stream happens.
        </p>
      </div>
      <VaultDivider className="mb-6" />

      {!profileId && (
        <VaultPanel className="p-4 mb-6 text-sm text-muted-foreground">
          All ideas, all creators. Hit a profile&apos;s Chat Made Me Do It link to pitch someone specific.
        </VaultPanel>
      )}

      {user && profileId && (
        <form onSubmit={submitIdea}>
          <VaultPanel className="p-6 mb-8 space-y-3">
          <h2 className="font-semibold text-vault-cream mb-2">
            Pitch the stream
          </h2>
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Idea title — e.g. '24hr horror game marathon'"
            required
            className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground focus:outline-none focus:border-vault-bronze/60"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Details (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground focus:outline-none focus:border-vault-bronze/60 resize-none"
          />
          <button type="submit" disabled={submitting} className="w-full h-10 rounded-lg bg-vault-gold text-vault-deep font-semibold text-sm disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit Idea'}
          </button>
          </VaultPanel>
        </form>
      )}

      {loading && <p className="text-muted-foreground text-sm animate-pulse text-center py-8">Loading ideas…</p>}

      {!loading && ideas.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">Nothing pitched yet. Chat&apos;s been too polite.</p>
      )}

      <div className="space-y-4">
        {ideas.map(idea => (
          <VaultPanel key={idea.id} className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-semibold text-vault-cream">{idea.title}</h3>
                <p className="text-xs text-muted-foreground">by {idea.submitted_by}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${
                idea.status === 'completed' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                idea.status === 'selected' ? 'bg-vault-gold/15 text-vault-gold border-vault-gold/30' :
                'bg-muted/40 text-muted-foreground border-border'
              }`}>
                {idea.status}
              </span>
            </div>

            {idea.description && <p className="text-sm text-muted-foreground mb-3">{idea.description}</p>}

            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => upvote(idea.id)}
                disabled={!user || busyId === idea.id}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-vault-gold disabled:opacity-50"
              >
                <ThumbsUp className="h-3.5 w-3.5" /> {idea.upvotes}
              </button>

              {isOwner && !idea.goal && idea.status === 'pending' && (
                <button
                  onClick={() => setGoal(idea.id)}
                  disabled={busyId === idea.id}
                  className="flex items-center gap-1.5 text-xs text-vault-gold hover:underline disabled:opacity-50"
                >
                  <Target className="h-3.5 w-3.5" /> Set goal
                </button>
              )}
            </div>

            {idea.goal && (
              <div className="bg-muted/20 rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Coins className="h-3 w-3 text-vault-gold" />
                    {idea.goal.funded_amount} / {idea.goal.goal_amount} scraps
                  </span>
                  {idea.goal.status === 'funded' && <span className="text-xs text-green-400 font-medium">Goal met</span>}
                </div>
                <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-vault-gold transition-all"
                    style={{ width: `${Math.min((idea.goal.funded_amount / idea.goal.goal_amount) * 100, 100)}%` }}
                  />
                </div>
                {idea.goal.status === 'active' && user && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={pledgeAmount[idea.goal.id] ?? ''}
                      onChange={e => setPledgeAmount(p => ({ ...p, [idea.goal!.id]: e.target.value }))}
                      placeholder="Scraps"
                      className="flex-1 h-8 px-2 rounded-md bg-muted/30 border border-border text-vault-cream text-xs focus:outline-none"
                    />
                    <button
                      onClick={() => pledge(idea.goal!.id)}
                      disabled={busyId === idea.goal.id}
                      className="h-8 px-3 rounded-md bg-vault-gold text-vault-deep text-xs font-semibold disabled:opacity-50"
                    >
                      Pledge
                    </button>
                  </div>
                )}
              </div>
            )}
          </VaultPanel>
        ))}
      </div>

      {!user && (
        <VaultPanel className="p-5 text-center mt-6">
          <p className="text-muted-foreground text-sm mb-3">Sign in to pitch, vote, and pledge scraps.</p>
          <Link href="/login" className="text-vault-gold text-sm font-medium hover:underline">Sign In →</Link>
        </VaultPanel>
      )}
    </div>
  )
}

export default function CmdmiPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-2xl text-sm text-muted-foreground animate-pulse">Loading…</div>}>
      <CmdmiPageContent />
    </Suspense>
  )
}
