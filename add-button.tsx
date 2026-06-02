'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useVibeTags } from '@/hooks/use-data'
import { CheckCircle, XCircle, Zap, Flame, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface VTuberToTag {
  id: string
  name: string
  bio: string
  tags: string[]
}

export default function TagValidatorPage() {
  const { user, refreshUser } = useAuth()
  const { vibeTags } = useVibeTags()
  const [queue, setQueue] = useState<VTuberToTag[]>([])
  const [current, setCurrent] = useState<VTuberToTag | null>(null)
  const [currentTagIdx, setCurrentTagIdx] = useState(0)
  const [streak, setStreak] = useState(0)
  const [total, setTotal] = useState(0)
  const [scrapsEarned, setScrapsEarned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState<'confirm' | 'challenge' | null>(null)
  const [done, setDone] = useState(false)

  const loadQueue = useCallback(async () => {
    const url = user ? `/api/tag-validator?username=${user.username}` : '/api/tag-validator'
    const res = await fetch(url)
    const data = await res.json()
    setQueue(data)
    if (data.length > 0) { setCurrent(data[0]); setCurrentTagIdx(0) }
    else setDone(true)
    setLoading(false)
  }, [user])

  useEffect(() => { loadQueue() }, [loadQueue])

  const currentTag = current?.tags?.[currentTagIdx]
  const tagName = vibeTags.find(t => t.id === currentTag)?.name ?? currentTag

  const vote = async (action: 'confirm' | 'challenge') => {
    if (!current || !user) return
    setFlash(action)
    setTimeout(() => setFlash(null), 300)

    const res = await fetch('/api/tag-validator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: current.id, username: user.username, tag_id: currentTag, action }),
    })
    const data = await res.json()

    setStreak(data.streak)
    setTotal(data.total)
    if (data.scrapsAwarded > 0) {
      setScrapsEarned(prev => prev + data.scrapsAwarded)
      await refreshUser()
    }

    // Advance to next tag or next VTuber
    const nextTagIdx = currentTagIdx + 1
    if (current.tags && nextTagIdx < current.tags.length) {
      setCurrentTagIdx(nextTagIdx)
    } else {
      const nextQueue = queue.slice(1)
      setQueue(nextQueue)
      if (nextQueue.length > 0) {
        setCurrent(nextQueue[0])
        setCurrentTagIdx(0)
      } else {
        setDone(true)
      }
    }
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Zap className="h-10 w-10 text-vault-gold mx-auto" />
          <h2 className="text-xl font-bold text-vault-cream">Tag Validator</h2>
          <p className="text-muted-foreground text-sm">Sign in to validate tags and earn Vault Scraps.</p>
          <Button asChild className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border px-4 py-4">
        <div className="container mx-auto max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-vault-gold" />
            <h1 className="text-xl font-bold text-vault-cream">Tag Validator</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="font-bold text-vault-cream tabular-nums">{streak}</span>
              <span className="text-muted-foreground">streak</span>
            </div>
            {scrapsEarned > 0 && (
              <div className="flex items-center gap-1.5 text-green-400 font-medium">
                <Gift className="h-4 w-4" />
                +{scrapsEarned} scraps
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">

          {loading ? (
            <div className="vault-card rounded-2xl p-8 animate-pulse h-64" />
          ) : done ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <h2 className="text-xl font-bold text-vault-cream">All caught up!</h2>
              <p className="text-muted-foreground">
                You validated {total} tags total.
                {scrapsEarned > 0 && ` Earned ${scrapsEarned} Vault Scraps!`}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => { setDone(false); setLoading(true); loadQueue() }}
                  variant="outline" className="border-border text-vault-cream">
                  Check for more
                </Button>
                <Button asChild className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
                  <Link href="/discover">Back to Star Map</Link>
                </Button>
              </div>
            </div>
          ) : current && currentTag ? (
            <div className={`vault-card rounded-2xl p-8 transition-all duration-150 ${
              flash === 'confirm' ? 'border-green-500/60 bg-green-500/5' :
              flash === 'challenge' ? 'border-red-500/60 bg-red-500/5' : ''
            }`}>
              {/* Progress */}
              <div className="flex justify-between text-xs text-muted-foreground mb-6">
                <span>{total} validated</span>
                <span>Every 10 = +25 scraps 🎁</span>
              </div>

              {/* VTuber info */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-vault-cream mb-1">{current.name}</h2>
                {current.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{current.bio}</p>
                )}
              </div>

              {/* The tag to validate */}
              <div className="text-center mb-8">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Does this tag fit?</p>
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-vault-gold/15 border border-vault-gold/40">
                  <span className="text-xl font-bold text-vault-gold">{tagName}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Tag {currentTagIdx + 1} of {current.tags?.length ?? 1}
                </p>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => vote('challenge')}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-red-500/30 bg-red-500/5 hover:border-red-500/60 hover:bg-red-500/10 transition-all active:scale-[0.97] group"
                >
                  <XCircle className="h-8 w-8 text-red-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-vault-cream">Challenge</span>
                  <span className="text-xs text-muted-foreground">Doesn't fit</span>
                </button>
                <button
                  onClick={() => vote('confirm')}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-green-500/30 bg-green-500/5 hover:border-green-500/60 hover:bg-green-500/10 transition-all active:scale-[0.97] group"
                >
                  <CheckCircle className="h-8 w-8 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-vault-cream">Confirm</span>
                  <span className="text-xs text-muted-foreground">Fits well</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
