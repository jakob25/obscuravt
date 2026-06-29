'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import type { CircleFeedItem, CircleOshi, YourCircleResponse } from '@/lib/types'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatTime12h(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function OshiAvatar({ oshi }: { oshi: CircleOshi }) {
  return (
    <Link
      href={`/vtuber/${oshi.id}`}
      className="flex flex-col items-center gap-1 shrink-0 group"
      title={oshi.name}
    >
      {oshi.avatar_url ? (
        <img
          src={oshi.avatar_url}
          alt={oshi.name}
          className="h-11 w-11 object-cover border border-vault-bronze/40 group-hover:border-vault-gold/50 transition-colors"
        />
      ) : (
        <div className="h-11 w-11 flex items-center justify-center text-sm font-bold text-vault-deep bg-vault-gold/80 border border-vault-bronze/40 group-hover:border-vault-gold/50">
          {oshi.name.charAt(0)}
        </div>
      )}
      <span className="text-[10px] text-muted-foreground group-hover:text-vault-gold truncate max-w-[56px]">
        {oshi.name.split(' ')[0]}
      </span>
    </Link>
  )
}

function FeedRow({ item }: { item: CircleFeedItem }) {
  if (item.kind === 'cmdmi_goal') {
    const pct = item.goalAmount > 0
      ? Math.min(Math.round((item.fundedAmount / item.goalAmount) * 100), 100)
      : 0
    return (
      <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Chat Made Me Do It · {item.vtuberName}</p>
            <p className="text-sm font-medium text-vault-cream line-clamp-1">{item.ideaTitle}</p>
          </div>
          <Link href={`/cmdmi?profile=${item.vtuberId}`} className="text-xs text-vault-gold hover:underline shrink-0">
            Pledge →
          </Link>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{item.fundedAmount.toLocaleString()} / {item.goalAmount.toLocaleString()} scraps</span>
          <span className="text-vault-gold">{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>
    )
  }

  if (item.kind === 'prediction') {
    return (
      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Prediction · {item.vtuberName}</p>
          <p className="text-sm font-medium text-vault-cream line-clamp-1">{item.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{item.status}</p>
        </div>
        <Link href={`/vtuber/${item.vtuberId}`} className="text-xs text-vault-gold hover:underline shrink-0">
          Wager →
        </Link>
      </div>
    )
  }

  if (item.kind === 'clip') {
    return (
      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">New clip · {item.vtuberName}</p>
          <p className="text-sm font-medium text-vault-cream line-clamp-1">{item.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">↑ {item.upvotes}</p>
        </div>
        <a href={item.clipUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-vault-gold hover:underline shrink-0">
          Watch →
        </a>
      </div>
    )
  }

  if (item.kind === 'meme') {
    return (
      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">New meme · {item.vtuberName}</p>
          <p className="text-sm font-medium text-vault-cream line-clamp-1">{item.caption || 'Reaction dropped'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">↑ {item.upvotes}</p>
        </div>
        <Link href={`/meme/${item.shareSlug}`} className="text-xs text-vault-gold hover:underline shrink-0">
          View →
        </Link>
      </div>
    )
  }

  if (item.kind === 'qa_session') {
    return (
      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Q&A open · {item.vtuberName}</p>
          <p className="text-sm font-medium text-vault-cream line-clamp-1">{item.title}</p>
        </div>
        <Link href={`/vtuber/${item.vtuberId}`} className="text-xs text-vault-gold hover:underline shrink-0">
          Ask →
        </Link>
      </div>
    )
  }

  if (item.kind === 'karaoke') {
    return (
      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Karaoke · {item.vtuberName}</p>
          <p className="text-sm font-medium text-vault-cream line-clamp-1">
            {item.songTitle}{item.artist ? ` — ${item.artist}` : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{item.status} · ↑ {item.upvotes}</p>
        </div>
        <Link href={`/vtuber/${item.vtuberId}`} className="text-xs text-vault-gold hover:underline shrink-0">
          Queue →
        </Link>
      </div>
    )
  }

  if (item.kind === 'schedule_vote') {
    return (
      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Schedule vote · {item.vtuberName}</p>
          <p className="text-sm font-medium text-vault-cream">
            {DAYS[item.proposedDay]} {formatTime12h(item.proposedTime)}
          </p>
          {item.label && <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>}
          <p className="text-xs text-muted-foreground mt-0.5">{item.votes} vote{item.votes === 1 ? '' : 's'}</p>
        </div>
        <Link href={`/vtuber/${item.vtuberId}`} className="text-xs text-vault-gold hover:underline shrink-0">
          Vote →
        </Link>
      </div>
    )
  }

  if (item.kind === 'schedule') {
    return (
      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Schedule · {item.vtuberName}</p>
          <p className="text-sm font-medium text-vault-cream">
            {DAYS[item.dayOfWeek]} {formatTime12h(item.startTime)} {item.timezone}
          </p>
          {item.label && <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>}
        </div>
        <Link href={`/schedule?vtuber=${item.vtuberId}`} className="text-xs text-vault-gold hover:underline shrink-0">
          Full →
        </Link>
      </div>
    )
  }

  return null
}

export function YourCircleWidget() {
  const [data, setData] = useState<YourCircleResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/your-circle', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { oshis: [], items: [] })
      .then(setData)
      .catch(() => setData({ oshis: [], items: [] }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="vault-panel">
        <p className="text-sm text-muted-foreground animate-pulse">Loading your Circle…</p>
      </section>
    )
  }

  const oshis = data?.oshis ?? []
  const items = data?.items ?? []

  if (oshis.length === 0) {
    return (
      <section className="vault-panel">
        <h2 className="text-lg font-bold text-vault-cream mb-2">Your Circle</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Follow oshis and their activity shows up here — Chat Made Me Do It, predictions, memes, Q&A, karaoke, and more.
        </p>
        <Link href="/discover" className="text-sm text-vault-gold hover:underline font-medium">
          Open Star Map to find someone →
        </Link>
      </section>
    )
  }

  return (
    <section className="vault-panel md:col-span-2">
      <div className="vault-scanline-header flex items-center justify-between mb-4 pb-1">
        <h2 className="text-lg font-bold text-vault-cream">Your Circle</h2>
        <span className="text-xs text-muted-foreground">{oshis.length} oshi{oshis.length === 1 ? '' : 's'}</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 mb-4 border-b border-border/50">
        {oshis.map(o => (
          <OshiAvatar key={o.id} oshi={o} />
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Your oshis are quiet right now. Check back after streams or pledges.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <FeedRow key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}