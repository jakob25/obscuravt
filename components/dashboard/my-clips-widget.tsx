'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Film, TrendingUp, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { normalizeRole } from '@/lib/roles'

interface ClipRow {
  id: string
  title: string
  upvotes: number
  created_at: string
}

interface ClipStats {
  total_clips: number
  total_upvotes: number
  avg_upvotes: number
}

export function MyClipsWidget() {
  const { user } = useAuth()
  const [clips, setClips] = useState<ClipRow[]>([])
  const [stats, setStats] = useState<ClipStats | null>(null)
  const [loading, setLoading] = useState(true)

  const role = normalizeRole(user?.role ?? null)
  const show = role === 'Fan' || role === 'Creator' || role === 'VTuber'

  useEffect(() => {
    if (!user || !show) { setLoading(false); return }
    fetch('/api/clips/mine', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setClips(data.clips ?? [])
          setStats(data.stats ?? null)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user, show])

  if (!show) return null

  return (
    <section className="vault-card rounded-xl overflow-hidden">
      <div className="px-4 py-3.5 border-b border-border bg-vault-deep/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-vault-gold" />
          <h2 className="font-bold text-vault-cream">Your Clips</h2>
        </div>
        <Link href="/clips" className="text-xs text-vault-gold hover:text-vault-amber flex items-center gap-1">
          Submit <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="p-4 space-y-2">{[1, 2].map(i => <div key={i} className="h-10 rounded animate-pulse bg-muted/30" />)}</div>
      ) : !stats || stats.total_clips === 0 ? (
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-2">No clips submitted yet.</p>
          <Link href="/clips" className="text-xs text-vault-gold hover:underline font-medium">
            Browse clips or submit one with a timestamp →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-px bg-border">
            {[
              { label: 'Submitted', value: stats.total_clips },
              { label: 'Total upvotes', value: stats.total_upvotes },
              { label: 'Avg / clip', value: stats.avg_upvotes },
            ].map(({ label, value }) => (
              <div key={label} className="bg-vault-deep/80 px-3 py-3 text-center">
                <p className="text-lg font-bold text-vault-gold tabular-nums">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="divide-y divide-border">
            {clips.slice(0, 4).map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-sm text-vault-cream truncate flex-1">{c.title}</p>
                <span className="text-xs text-vault-gold flex items-center gap-1 flex-shrink-0">
                  <TrendingUp className="h-3 w-3" />{c.upvotes}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}