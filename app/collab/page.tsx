'use client'

import { useState } from 'react'
import { Users, Calendar, EyeOff } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useVTubers } from '@/hooks/use-data'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'

export default function CollabPage() {
  const { vtubers } = useVTubers()
  const [sourceId, setSourceId] = useState('')
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [blind, setBlind] = useState(false)
  const [matches, setMatches] = useState<Array<{ id: string; name: string; matchPercent: number }>>([])
  const [overlap, setOverlap] = useState<Array<{ dayLabel: string; slots: Array<{ name: string; start_time: string }> }>>([])
  const [loading, setLoading] = useState(false)

  const runMatch = async () => {
    if (!sourceId) return
    setLoading(true)
    const res = await fetch(`/api/collab/match?a=${encodeURIComponent(sourceId)}&blind=${blind ? '1' : '0'}`)
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-2 flex items-center gap-2">
        <Users className="h-6 w-6 text-vault-gold" /> Collab & Networking
      </GlitchHeading>
      <p className="text-sm text-muted-foreground mb-6">
        Match by shared vibe tags (Jaccard). No follower counts — ever.
      </p>

      <div className="mb-6">
        <label className="text-xs text-muted-foreground block mb-1">Your VTuber profile</label>
        <select
          value={sourceId}
          onChange={e => setSourceId(e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm"
        >
          <option value="">Select a creator…</option>
          {vtubers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      <Tabs defaultValue="match">
        <TabsList className="mb-4 bg-muted/50">
          <TabsTrigger value="match">Vibe Match %</TabsTrigger>
          <TabsTrigger value="blind">Blind Collab</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Comparer</TabsTrigger>
        </TabsList>

        <TabsContent value="match">
          <button onClick={runMatch} disabled={!sourceId || loading} className="mb-4 px-4 py-2 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold disabled:opacity-50">
            Find similar vibes
          </button>
          <div className="space-y-2">
            {matches.map(m => (
              <VaultFrame key={m.id}>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-vault-cream font-medium">{m.name}</span>
                  <span className="text-vault-gold font-bold">{m.matchPercent}%</span>
                </div>
              </VaultFrame>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="blind">
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><EyeOff className="h-3 w-3" /> Names hidden — match % only</p>
          <button onClick={() => { setBlind(true); runMatch() }} disabled={!sourceId || loading} className="mb-4 px-4 py-2 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold disabled:opacity-50">
            Blind match
          </button>
          <div className="space-y-2">
            {matches.map(m => (
              <VaultFrame key={m.id}>
                <div className="p-4 flex justify-between"><span className="text-muted-foreground">{m.name}</span><span className="text-vault-gold font-bold">{m.matchPercent}%</span></div>
              </VaultFrame>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><Calendar className="h-3 w-3" /> Pick creators to compare overlap</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {vtubers.filter(v => v.id !== sourceId).slice(0, 8).map(v => (
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