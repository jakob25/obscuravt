'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, EyeOff, Eye } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useVTubers } from '@/hooks/use-data'
import { useAuth } from '@/lib/auth-context'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'

interface MatchRow {
  id: string
  name: string
  realName?: string
  matchPercent: number
  communityPercent?: number
}

export default function CollabPage() {
  const { vtubers } = useVTubers()
  const { user } = useAuth()
  const [sourceId, setSourceId] = useState('')
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [blind, setBlind] = useState(false)
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [overlap, setOverlap] = useState<Array<{ dayLabel: string; slots: Array<{ name: string; start_time: string }> }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    fetch('/api/profiles/claimed', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const id = data?.activeId ?? data?.profiles?.[0]?.id
        if (id && !sourceId) setSourceId(id)
      })
      .catch(() => {})
  }, [user, sourceId])

  const runMatch = async (isBlind: boolean) => {
    if (!sourceId) return
    setBlind(isBlind)
    setLoading(true)
    setRevealed(new Set())
    const community = user ? '&community=1' : ''
    const res = await fetch(`/api/collab/match?a=${encodeURIComponent(sourceId)}&blind=${isBlind ? '1' : '0'}${community}`)
    const data = await res.json()
    setMatches(data.matches ?? [])
    setLoading(false)
  }

  const runSchedule = async () => {
    const ids = [sourceId, ...compareIds].filter(Boolean)
    if (ids.length < 2) return
    setLoading(true)
    const res = await fetch(`/api/collab/schedules?ids=${ids.map(encodeURIComponent).join(',')}`)
    const data = await res.json()
    setOverlap(data.overlapDays ?? [])
    setLoading(false)
  }

  const overlapSlotCount = overlap.reduce((n, d) => n + d.slots.length, 0)

  const MatchCard = ({ m, showReveal }: { m: MatchRow; showReveal?: boolean }) => {
    const isRevealed = revealed.has(m.id)
    const displayName = showReveal && !isRevealed ? m.name : (m.realName ?? m.name)
    return (
      <VaultFrame key={m.id}>
        <div className="p-4">
          <div className="flex justify-between items-center gap-3">
            <div className="min-w-0">
              {showReveal && !isRevealed ? (
                <button
                  type="button"
                  onClick={() => setRevealed(prev => new Set([...prev, m.id]))}
                  className="text-sm text-muted-foreground hover:text-vault-gold flex items-center gap-1"
                >
                  <Eye className="h-3.5 w-3.5" /> Reveal match
                </button>
              ) : (
                <Link href={`/vtuber/${m.id}`} className="text-vault-cream font-medium hover:text-vault-gold">
                  {displayName}
                </Link>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-vault-gold font-bold">{m.matchPercent}%</span>
              <span className="text-[10px] text-muted-foreground block">vibe</span>
            </div>
          </div>
          {m.communityPercent !== undefined && (
            <p className="text-xs text-muted-foreground mt-2">
              {m.communityPercent}% of your Circle fans also follow them
            </p>
          )}
        </div>
      </VaultFrame>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-2">
        Collab & Networking
      </GlitchHeading>
      <p className="text-sm text-muted-foreground mb-4">
        Vibe match by tags. Community overlap by shared fans. Zero follower worship.
      </p>
      <VaultDivider className="mb-6" />

      <VaultPanel className="p-4 mb-6">
        <label className="text-xs text-muted-foreground block mb-1">Your VTuber profile</label>
        <select
          value={sourceId}
          onChange={e => setSourceId(e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm"
        >
          <option value="">Select a creator…</option>
          {vtubers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </VaultPanel>

      <Tabs defaultValue="match">
        <TabsList className="mb-4 bg-muted/50">
          <TabsTrigger value="match">Vibe Match %</TabsTrigger>
          <TabsTrigger value="blind">Blind Collab</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Comparer</TabsTrigger>
        </TabsList>

        <TabsContent value="match">
          <button onClick={() => runMatch(false)} disabled={!sourceId || loading} className="mb-4 px-4 py-2 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold disabled:opacity-50">
            Find similar vibes
          </button>
          <div className="space-y-2">
            {matches.map(m => <MatchCard key={m.id} m={m} />)}
          </div>
        </TabsContent>

        <TabsContent value="blind">
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><EyeOff className="h-3 w-3" /> Names hidden — match % only until you reveal</p>
          <button onClick={() => runMatch(true)} disabled={!sourceId || loading} className="mb-4 px-4 py-2 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold disabled:opacity-50">
            Blind match
          </button>
          <div className="space-y-2">
            {matches.map(m => <MatchCard key={m.id} m={m} showReveal />)}
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><Calendar className="h-3 w-3" /> Pick creators to compare overlap</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {vtubers.filter(v => v.id !== sourceId).slice(0, 12).map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setCompareIds(prev => prev.includes(v.id) ? prev.filter(x => x !== v.id) : [...prev, v.id])}
                className={`px-3 py-1 rounded-full text-xs border ${compareIds.includes(v.id) ? 'border-vault-gold text-vault-gold' : 'border-border text-muted-foreground'}`}
              >
                {v.name}
              </button>
            ))}
          </div>
          <button onClick={runSchedule} disabled={!sourceId || compareIds.length === 0 || loading} className="mb-4 px-4 py-2 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold disabled:opacity-50">
            Compare schedules
          </button>
          {overlapSlotCount > 0 && (
            <p className="text-xs text-vault-gold mb-3">{overlapSlotCount} overlapping slot{overlapSlotCount === 1 ? '' : 's'} across {overlap.length} day{overlap.length === 1 ? '' : 's'}</p>
          )}
          {overlap.map(o => (
            <VaultFrame key={o.dayLabel} className="mb-2">
              <div className="p-4">
                <p className="font-medium text-vault-cream mb-2">{o.dayLabel}</p>
                {o.slots.map((s, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{s.name} · {s.start_time}</p>
                ))}
              </div>
            </VaultFrame>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}