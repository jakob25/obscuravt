'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'

interface ScheduleSlot {
  id: string
  vtuber_id: string
  day_of_week: number
  start_time: string
  timezone: string
  label: string | null
}

interface ClaimedProfile {
  id: string
  name: string
}

interface ScheduleProposal {
  id: string
  proposed_day: number
  proposed_time: string
  label: string | null
  votes: number
  dayLabel: string
  created_by: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatTime12h(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function SchedulePageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const vtuberId = searchParams.get('vtuber') ?? ''

  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [proposals, setProposals] = useState<ScheduleProposal[]>([])
  const [claimedProfiles, setClaimedProfiles] = useState<ClaimedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [dayOfWeek, setDayOfWeek] = useState(0)
  const [startTime, setStartTime] = useState('20:00')
  const [timezone, setTimezone] = useState('EST')
  const [label, setLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const ownedIds = new Set(claimedProfiles.map(p => p.id))
  const isOwner = !!user && !!vtuberId && ownedIds.has(vtuberId)
  const activeProfile = claimedProfiles.find(p => p.id === vtuberId)

  const loadClaimed = useCallback(async () => {
    if (!user) {
      setClaimedProfiles([])
      return
    }
    const res = await fetch('/api/profiles/claimed', { credentials: 'include' })
    if (!res.ok) {
      setClaimedProfiles([])
      return
    }
    const data = await res.json()
    setClaimedProfiles(data.profiles ?? [])
  }, [user])

  const load = useCallback(async () => {
    if (!vtuberId) { setLoading(false); return }
    setLoading(true)
    const [schedRes, votesRes] = await Promise.all([
      fetch(`/api/schedule?vtuberId=${encodeURIComponent(vtuberId)}`),
      fetch(`/api/schedule-votes?vtuberId=${encodeURIComponent(vtuberId)}`),
    ])
    const schedData = await schedRes.json()
    const votesData = await votesRes.json()
    setSchedule(schedData.schedule ?? [])
    setProposals(votesData.proposals ?? [])
    setLoading(false)
  }, [vtuberId])

  useEffect(() => { loadClaimed() }, [loadClaimed])
  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!user || vtuberId || claimedProfiles.length === 0) return
    const activeId = claimedProfiles[0]?.id
    if (activeId) router.replace(`/schedule?vtuber=${encodeURIComponent(activeId)}`)
  }, [user, vtuberId, claimedProfiles, router])

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !vtuberId) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vtuberId, dayOfWeek, startTime, timezone, label: label || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLabel(''); setShowForm(false)
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add slot')
    } finally {
      setSubmitting(false)
    }
  }

  const removeSlot = async (id: string) => {
    if (!confirm('Remove this stream time?')) return
    await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' })
    load()
  }

  const promoteProposal = async (p: ScheduleProposal) => {
    if (!user || !vtuberId) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vtuberId,
          dayOfWeek: p.proposed_day,
          startTime: p.proposed_time,
          timezone: 'EST',
          label: p.label || `Fan vote (${p.votes})`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to promote proposal')
    } finally {
      setSubmitting(false)
    }
  }

  const sorted = [...schedule].sort((a, b) => a.day_of_week - b.day_of_week)

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <PageBackNav fallbackHref={vtuberId ? `/vtuber/${vtuberId}` : '/discover'} />
      <div className="flex items-center justify-between mb-8">
        <div>
          <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-1">
            Stream Schedule
          </GlitchHeading>
          <p className="text-muted-foreground text-sm">
            {activeProfile ? `${activeProfile.name}'s stream times` : 'Know when they go live. No FOMO required.'}
          </p>
        </div>
        {isOwner && vtuberId && (
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold flex-shrink-0"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        )}
      </div>

      {user && claimedProfiles.length > 0 && (
        <div className="mb-6">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Managing profile
          </label>
          <div className="relative">
            <select
              value={vtuberId}
              onChange={e => router.push(`/schedule?vtuber=${encodeURIComponent(e.target.value)}`)}
              className="w-full h-10 px-3 pr-9 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm appearance-none focus:outline-none focus:border-vault-bronze/60"
            >
              {claimedProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      <VaultDivider className="mb-6" />

      {!vtuberId && !user && (
        <VaultPanel className="p-6 text-center text-sm text-muted-foreground">
          Pick a creator&apos;s profile to see when they stream.
        </VaultPanel>
      )}

      {!vtuberId && user && claimedProfiles.length === 0 && (
        <VaultPanel className="p-6 text-center text-sm text-muted-foreground space-y-3">
          <p>You haven&apos;t claimed a VTuber profile yet.</p>
          <Link href="/discover" className="text-vault-gold hover:underline">Browse dossiers to claim one →</Link>
        </VaultPanel>
      )}

      {showForm && (
        <form onSubmit={addSlot}>
          <VaultPanel className="p-6 mb-6 space-y-3">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
          <select
            value={dayOfWeek}
            onChange={e => setDayOfWeek(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm focus:outline-none focus:border-vault-bronze/60"
          >
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
          <div className="flex gap-2">
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm focus:outline-none focus:border-vault-bronze/60"
            />
            <input
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              placeholder="EST, JST, GMT…"
              className="flex-1 h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground focus:outline-none focus:border-vault-bronze/60"
            />
          </div>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Label (optional) — e.g. 'Karaoke Night'"
            className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground focus:outline-none focus:border-vault-bronze/60"
          />
          <button type="submit" disabled={submitting} className="w-full h-10 rounded-lg bg-vault-gold text-vault-deep font-semibold text-sm disabled:opacity-50">
            {submitting ? 'Adding…' : 'Add Time Slot'}
          </button>
          </VaultPanel>
        </form>
      )}

      {loading && vtuberId && <p className="text-muted-foreground text-sm animate-pulse text-center py-8">Loading schedule…</p>}

      {!loading && vtuberId && sorted.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">No scheduled times yet.</p>
      )}

      {isOwner && proposals.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-vault-cream mb-2">Fan proposals — promote to schedule</h2>
          <div className="space-y-2">
            {proposals.slice(0, 5).map(p => (
              <VaultPanel key={p.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-vault-cream">
                    {p.dayLabel} {formatTime12h(p.proposed_time)}
                    {p.label && <span className="text-vault-gold"> · {p.label}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.votes} vote{p.votes === 1 ? '' : 's'} · @{p.created_by}
                  </div>
                </div>
                <button
                  onClick={() => promoteProposal(p)}
                  disabled={submitting}
                  className="text-xs px-3 py-1.5 rounded-lg bg-vault-gold text-vault-deep font-semibold disabled:opacity-50 shrink-0"
                >
                  Promote
                </button>
              </VaultPanel>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map(slot => (
          <VaultPanel key={slot.id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-vault-cream">{DAYS[slot.day_of_week]}</div>
              <div className="text-sm text-muted-foreground">
                {slot.start_time} {slot.timezone}
                {slot.label && <span className="text-vault-gold"> · {slot.label}</span>}
              </div>
            </div>
            {isOwner && (
              <button onClick={() => removeSlot(slot.id)} className="text-muted-foreground hover:text-red-400 flex-shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </VaultPanel>
        ))}
      </div>

      {!user && vtuberId && (
        <VaultPanel className="p-5 text-center mt-6">
          <Link href="/login" className="text-vault-gold text-sm font-medium hover:underline">Sign in for more →</Link>
        </VaultPanel>
      )}
    </div>
  )
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-xl text-sm text-muted-foreground animate-pulse">Loading schedule…</div>}>
      <SchedulePageContent />
    </Suspense>
  )
}