'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { normalizeRole } from '@/lib/roles'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface ScheduleSlot {
  id: string
  vtuber_id: string
  day_of_week: number
  start_time: string
  timezone: string
  label: string | null
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function SchedulePage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const vtuberId = searchParams.get('vtuber') ?? ''

  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [dayOfWeek, setDayOfWeek] = useState(0)
  const [startTime, setStartTime] = useState('20:00')
  const [timezone, setTimezone] = useState('EST')
  const [label, setLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isOwner = normalizeRole(user?.role ?? null) === 'VTuber' && !!vtuberId

  const load = useCallback(async () => {
    if (!vtuberId) { setLoading(false); return }
    setLoading(true)
    const res = await fetch(`/api/schedule?vtuberId=${encodeURIComponent(vtuberId)}`)
    const data = await res.json()
    setSchedule(data.schedule ?? [])
    setLoading(false)
  }, [vtuberId])

  useEffect(() => { load() }, [load])

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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const removeSlot = async (id: string) => {
    if (!confirm('Remove this stream time?')) return
    await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' })
    load()
  }

  const sorted = [...schedule].sort((a, b) => a.day_of_week - b.day_of_week)

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-vault-cream mb-1 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-vault-gold" />
            Stream Schedule
          </h1>
          <p className="text-muted-foreground text-sm">Never miss a stream.</p>
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

      {!vtuberId && (
        <div className="vault-card rounded-xl p-6 text-center text-sm text-muted-foreground">
          Visit a specific creator's profile to view their stream schedule.
        </div>
      )}

      {showForm && (
        <form onSubmit={addSlot} className="vault-card rounded-2xl p-6 mb-6 space-y-3">
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
        </form>
      )}

      {loading && vtuberId && <p className="text-muted-foreground text-sm animate-pulse text-center py-8">Loading schedule…</p>}

      {!loading && vtuberId && sorted.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">No scheduled times yet.</p>
      )}

      <div className="space-y-2">
        {sorted.map(slot => (
          <div key={slot.id} className="vault-card rounded-xl p-4 flex items-center justify-between gap-4">
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
          </div>
        ))}
      </div>

      {!user && vtuberId && (
        <div className="vault-card rounded-xl p-5 text-center mt-6">
          <Link href="/login" className="text-vault-gold text-sm font-medium hover:underline">Sign in for more →</Link>
        </div>
      )}
    </div>
  )
}
