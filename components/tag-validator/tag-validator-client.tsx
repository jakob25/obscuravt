'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { CheckCircle, XCircle, SkipForward } from 'lucide-react'
import Link from 'next/link'
import { VaultPanel, VaultDivider } from '@/components/vault/vault-surfaces'
import { GlitchHeading } from '@/components/vault/glitch-heading'

interface VTuber {
  id: string
  name: string
  bio: string
  tags: string[]
}

interface CanonicalTag {
  id: string
  tag: string
  category: string
  color: string
  description: string
}

interface QueueItem {
  vtuber: VTuber
  tag: CanonicalTag
}

const STREAK_TARGET = 10
const STREAK_BONUS = 100

export function TagValidatorClient() {
  const { user } = useAuth()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [current, setCurrent] = useState<QueueItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const [sessionVotes, setSessionVotes] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<'confirm' | 'challenge' | 'skip' | null>(null)
  const [error, setError] = useState('')

  const buildQueue = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/tag-validator')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load queue')
      }
      const data = await res.json()
      const items: QueueItem[] = data.queue ?? []
      setQueue(items)
      setCurrent(items[0] ?? null)
      setStreak(data.streak ?? 0)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load queue')
      setQueue([])
      setCurrent(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    buildQueue()
  }, [buildQueue])

  const vote = async (voteValue: 1 | -1 | 0) => {
    if (!current || voting) return
    setVoting(true)
    setFeedback(voteValue === 1 ? 'confirm' : voteValue === -1 ? 'challenge' : 'skip')

    if (user) {
      try {
        const res = await fetch('/api/tag-validator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vtuberId: current.vtuber.id,
            tagId: current.tag.id,
            vote: voteValue,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.scrapsAwarded > 0) {
            setSessionScore(s => s + data.scrapsAwarded)
          }
          setStreak(data.streak ?? 0)
          if (voteValue !== 0) setSessionVotes(v => v + 1)
        }
      } catch {
        // Non-fatal — still advance queue
      }
    }

    setTimeout(() => {
      setFeedback(null)
      setQueue(q => {
        const next = q.slice(1)
        setCurrent(next[0] ?? null)
        return next
      })
      setVoting(false)
    }, 400)
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <VaultPanel className="p-8 max-w-sm w-full text-center">
          <GlitchHeading as="h2" className="text-xl font-bold text-vault-cream mb-2">Tag Validator</GlitchHeading>
          <p className="text-muted-foreground text-sm mb-6">
            Sign in. Judge tags. Get paid in scraps. The Archive runs on your taste.
          </p>
          <Link href="/login" className="inline-flex items-center justify-center w-full h-10 rounded-lg bg-vault-gold text-vault-deep font-semibold text-sm">
            Sign In
          </Link>
        </VaultPanel>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading queue…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <VaultPanel className="p-8 max-w-sm w-full text-center">
          <p className="text-sm text-red-400 mb-4">{error}</p>
          <button
            onClick={buildQueue}
            className="inline-flex items-center justify-center w-full h-10 rounded-lg bg-vault-gold text-vault-deep font-semibold text-sm"
          >
            Retry
          </button>
        </VaultPanel>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <VaultPanel className="p-8 max-w-sm w-full text-center">
          <GlitchHeading as="h2" className="text-xl font-bold text-vault-cream mb-2">Queue cleared</GlitchHeading>
          <p className="text-muted-foreground text-sm mb-2">
            {sessionVotes} tags judged this session. Not bad.
          </p>
          <p className="text-vault-gold font-semibold mb-6">+{sessionScore} scraps</p>
          <button
            onClick={() => { setLoading(true); buildQueue() }}
            className="inline-flex items-center justify-center w-full h-10 rounded-lg bg-vault-gold text-vault-deep font-semibold text-sm"
          >
            Load more
          </button>
        </VaultPanel>
      </div>
    )
  }

  const tagColor = current.tag.color ?? '#d4a574'

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 gap-6">
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap justify-center">
        <span>{queue.length} left in queue</span>
        <span className="text-vault-gold font-medium">+{sessionScore} scraps this session</span>
        <span className="px-2.5 py-1 rounded-full border border-vault-gold/30 text-vault-gold font-semibold">
          Streak {streak}/{STREAK_TARGET}
        </span>
      </div>

      <VaultPanel className={`p-6 w-full max-w-md transition-all duration-200 ${
        feedback === 'confirm' ? 'border-green-500/60 bg-green-500/5' :
        feedback === 'challenge' ? 'border-red-500/60 bg-red-500/5' : ''
      }`}>
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-1">VTuber</p>
          <h2 className="text-xl font-bold text-vault-cream">{current.vtuber.name}</h2>
          {current.vtuber.bio && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{current.vtuber.bio}</p>
          )}
          {(current.vtuber.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {current.vtuber.tags.slice(0, 6).map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border">
                  {t.replace(/^(clust_|vibe_|cont_)/, '')}
                </span>
              ))}
            </div>
          )}
        </div>

        <VaultDivider className="my-4" />

        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2">Does this tag fit?</p>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold"
            style={{ borderColor: tagColor + '60', backgroundColor: tagColor + '15', color: tagColor }}
          >
            {current.tag.tag}
          </div>
          {current.tag.description && (
            <p className="text-xs text-muted-foreground mt-2">{current.tag.description}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => vote(-1)}
            disabled={voting}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 transition-all font-medium disabled:opacity-50"
          >
            <XCircle className="h-5 w-5" />
            Challenge
          </button>
          <button
            type="button"
            onClick={() => vote(0)}
            disabled={voting}
            className="flex items-center justify-center gap-1 h-12 px-4 rounded-xl border border-border text-muted-foreground hover:text-vault-cream hover:border-vault-bronze/40 transition-all text-sm disabled:opacity-50"
          >
            <SkipForward className="h-4 w-4" />
            Skip
          </button>
          <button
            type="button"
            onClick={() => vote(1)}
            disabled={voting}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/60 transition-all font-medium disabled:opacity-50"
          >
            <CheckCircle className="h-5 w-5" />
            Confirm
          </button>
        </div>
      </VaultPanel>

      <p className="text-xs text-muted-foreground text-center">
        {STREAK_BONUS} scraps every {STREAK_TARGET} in a row · Skip kills the streak
      </p>
    </div>
  )
}