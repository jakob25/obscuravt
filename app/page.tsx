'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Compass, Trophy, ArrowRight, TrendingUp, Clock, Sparkles,
  Gift, Tag, Gamepad2,
} from 'lucide-react'
import { useVTubers, useClips, useBets } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'
import { VibeTagList } from '@/components/common/vibe-tag'
import { ClipCard } from '@/components/common/clip-card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'
import { useDashboardLayout, DashboardCustomizer, type WidgetId } from '@/components/common/dashboard-customizer'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { MarketingHome } from '@/components/landing/marketing-home'
import { FirstRunChecklist } from '@/components/onboarding/first-run-checklist'
import { EMPTY } from '@/lib/site-copy'


import { MyClipsWidget } from '@/components/dashboard/my-clips-widget'
import { YourCircleWidget } from '@/components/dashboard/your-circle-widget'
import { normalizeRole, ROLE_ALLOWED_WIDGETS, ROLE_DEFAULT_WIDGETS, type AppRole } from '@/lib/roles'
import { ALL_WIDGETS } from '@/components/common/dashboard-customizer'
import type { WeeklyDigest } from '@/lib/types'

// ── Individual widget components ──────────────────────────────────────

function TrendingClipsWidget() {
  const { clips, loading } = useClips()
  const top = [...clips].sort((a, b) => b.votes.up - a.votes.up).slice(0, 4)
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <GlitchHeading as="h2" className="text-xl font-bold text-vault-cream">Top clips</GlitchHeading>
        <Link href="/clips" className="text-sm text-vault-gold hover:text-vault-amber flex items-center gap-1">
          All clips <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="vault-card rounded-lg aspect-video animate-pulse bg-muted/30" />)}
        </div>
      ) : top.length === 0 ? (
        <p className="text-muted-foreground text-sm">{EMPTY.clips}</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {top.map(clip => <ClipCard key={clip.id} clip={clip} />)}
        </div>
      )}
    </section>
  )
}

function ActiveBetsWidget() {
  const { bets, loading } = useBets()
  const open = bets.filter(b => b.status === 'open').slice(0, 3)
  return (
    <section className="bet-slip">
      <div className="px-4 py-3.5 border-b border-dashed border-vault-bronze/30 flex items-center justify-between">
        <h2 className="font-bold text-vault-cream font-mono text-sm uppercase tracking-wider">Open slips</h2>
        <Link href="/bets" className="text-xs text-vault-gold hover:text-vault-amber flex items-center gap-1">
          All bets <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded animate-pulse bg-muted/30" />)}</div>
      ) : open.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">{EMPTY.bets}</p>
      ) : (
        <div className="divide-y divide-border">
          {open.map(bet => {
            const total = bet.options.reduce((s, o) => s + o.totalScraps, 0)
            return (
              <Link key={bet.id} href="/bets" className="block p-4 hover:bg-vault-bronze/5 transition-colors">
                <h3 className="font-medium text-vault-cream text-sm line-clamp-1 mb-1.5">{bet.title}</h3>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="text-vault-gold font-medium">{total.toLocaleString()} scraps</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{bet.options.length} options</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

function ConstellationsWidget() {
  const { constellations } = useStarMapData()
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <GlitchHeading as="h2" className="text-xl font-bold text-vault-cream">Constellations</GlitchHeading>
        <Link href="/discover" className="text-sm text-vault-gold hover:text-vault-amber flex items-center gap-1">
          Star Map <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {constellations.map(c => (
          <Link key={c.id} href={`/discover?constellation=${c.id}`}
            className="vault-card rounded-lg p-4 hover:border-vault-gold/30 transition-all group">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full flex-shrink-0 star-glow" style={{ backgroundColor: c.color }} />
              <div className="min-w-0">
                <h3 className="font-medium text-vault-cream text-sm group-hover:text-vault-gold transition-colors truncate">{c.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{c.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}


function DailyLoopWidget() {
  const { user } = useAuth()
  return (
    <section className="vault-panel bg-gradient-to-r from-vault-gold/8 to-vault-amber/5 border-vault-gold/20">
      <div className="flex items-center justify-between mb-3">
        <GlitchHeading as="h2" className="font-bold text-vault-cream">Daily loop</GlitchHeading>
        {!user && (
          <Link href="/login" className="text-xs text-vault-gold hover:underline">Sign in to track</Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { Icon: Gift, label: 'Daily bonus', desc: '+250 scraps', href: '/my-profile' },
          { Icon: Tag, label: 'Tag validator', desc: '10-streak pays', href: '/tag-validator' },
          { Icon: Gamepad2, label: 'Silhouette', desc: 'Who is that?', href: '/silhouette' },
          { Icon: Trophy, label: 'Bets', desc: 'Wager & vote', href: '/bets' },
        ].map(({ Icon, label, desc, href }) => (
          <Link key={label} href={href}
            className="flex flex-col items-center p-3 rounded-xl bg-muted/20 border border-border hover:border-vault-gold/30 transition-all text-center group">
            <Icon className="h-6 w-6 mb-1.5 text-vault-gold" />
            <p className="text-xs font-medium text-vault-cream group-hover:text-vault-gold transition-colors">{label}</p>
            <p className="text-[10px] text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function FeaturedVTubersWidget() {
  const { vtubers, loading } = useVTubers()
  const { constellations } = useStarMapData()
  // Shuffle on each load — intentionally no "top by followers" sort
  // The whole point is to surface people you haven't seen before
  const featured = [...vtubers].sort(() => Math.random() - 0.5).slice(0, 6)
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div>
          <GlitchHeading as="h2" className="text-xl font-bold text-vault-cream">Random dossiers</GlitchHeading>
          <p className="text-xs text-muted-foreground mt-0.5">Shuffled each visit.</p>
        </div>
        <Link href="/discover" className="text-sm text-vault-gold hover:text-vault-amber flex items-center gap-1">
          Star Map <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mb-4" />
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="vault-card rounded-lg p-4 h-32 animate-pulse bg-muted/30" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {featured.map((v, i) => {
            const c = constellations.find(c => c.id === v.category)
            return (
              <Link key={v.id} href={`/vtuber/${v.id}`}
                className={`dossier-frame p-4 hover:border-vault-gold/40 transition-all group vault-grain ${i % 2 === 0 ? 'lg:-rotate-[0.3deg]' : 'lg:rotate-[0.3deg]'}`}>
                <div className="flex items-start gap-3 mb-3 relative z-10">
                  <img src={v.avatarUrl} alt={v.name}
                    className="h-10 w-10 object-cover border-2 border-vault-bronze/50 group-hover:border-vault-gold/50 transition-colors"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%)' }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-vault-cream truncate group-hover:text-vault-gold transition-colors">{v.name}</h3>
                    {c && <p className="text-xs mt-0.5 font-mono" style={{ color: c.color }}>{c.name}</p>}
                  </div>
                </div>
                {v.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-3 relative z-10">{v.bio}</p>}
                <div className="relative z-10"><VibeTagList tagIds={v.vibeTags} size="sm" maxTags={3} /></div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

function WeeklyDigestWidget() {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/weekly')
      .then(r => r.json())
      .then(setDigest)
      .catch(() => setDigest(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="vault-panel">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-vault-cream">This week in the Vault</h2>
        <Link href="/weekly" className="text-xs text-vault-gold hover:text-vault-amber">View full →</Link>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground animate-pulse">{EMPTY.weekly}</p>
      ) : !digest ? (
        <p className="text-sm text-muted-foreground">{EMPTY.digestOffline}</p>
      ) : (
        <div className="space-y-2 text-sm">
          {digest.topClips[0] && (
            <p className="text-vault-cream line-clamp-1">
              <TrendingUp className="h-3 w-3 text-vault-gold inline mr-1" />
              {digest.topClips[0].title}
              <span className="text-muted-foreground ml-1">· {digest.topClips[0].upvotes} upvotes</span>
            </p>
          )}
          {digest.topBet && (
            <p className="text-vault-cream line-clamp-1">
              <Trophy className="h-3 w-3 text-vault-gold inline mr-1" />
              {digest.topBet.title}
              <span className="text-muted-foreground ml-1">· {digest.topBet.entries} entries</span>
            </p>
          )}
          {digest.topVtuber && (
            <p className="text-vault-cream line-clamp-1">
              <Sparkles className="h-3 w-3 text-vault-gold inline mr-1" />
              {digest.topVtuber.name}
              <span className="text-muted-foreground ml-1">· spotlight creator</span>
            </p>
          )}
          {!digest.topClips[0] && !digest.topBet && !digest.topVtuber && (
            <p className="text-muted-foreground">Quiet week. Check back Monday.</p>
          )}
        </div>
      )}
    </section>
  )
}

function FindMyOshiWidget() {
  return (
    <section className="vault-panel bg-gradient-to-br from-vault-gold/5 to-vault-amber/5 border-vault-gold/20">
      <h2 className="font-bold text-vault-cream mb-2">Find my oshi</h2>
      <p className="text-sm text-muted-foreground mb-4">Five questions. Vibe match, not follower count.</p>
      <Button asChild size="sm" className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
        <Link href="/find-my-oshi">Take the quiz <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
      </Button>
    </section>
  )
}

function TagValidatorWidget() {
  return (
    <section className="vault-panel">
      <h2 className="font-bold text-vault-cream mb-2">Tag validator</h2>
      <p className="text-sm text-muted-foreground mb-4">Confirm or challenge tags. Ten in a row pays out.</p>
      <Button asChild size="sm" variant="outline" className="border-vault-bronze/40 text-vault-cream hover:border-vault-gold/40">
        <Link href="/tag-validator">Start validating <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
      </Button>
    </section>
  )
}

function LeaderboardWidget() {
  return (
    <section className="vault-panel">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-vault-cream">Leaderboard</h2>
        <Link href="/leaderboard" className="text-xs text-vault-gold hover:text-vault-amber">Full board →</Link>
      </div>
      <p className="text-sm text-muted-foreground">Who&apos;s hoarding scraps this week.</p>
    </section>
  )
}

function ForumsWidget() {
  return (
    <section className="vault-panel">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-vault-cream">Forums</h2>
        <Link href="/forums" className="text-xs text-vault-gold hover:text-vault-amber">Browse →</Link>
      </div>
      <p className="text-sm text-muted-foreground">Constellation chatter. Keep it short.</p>
    </section>
  )
}

function NotificationsWidget() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Array<{ id: string; title: string; message: string; is_read: boolean; created_at: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetch(`/api/notifications?username=${encodeURIComponent(user.username)}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setNotes(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <section className="vault-panel">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-vault-cream">Notifications</h2>
        <Link href="/notifications" className="text-xs text-vault-gold hover:text-vault-amber">See all →</Link>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground animate-pulse">Checking alerts…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing new. Add oshis to your Circle for Chat Made Me Do It, predictions, Q&A, and meme alerts.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map(n => (
            <li key={n.id} className={`text-sm ${n.is_read ? 'text-muted-foreground' : 'text-vault-cream'}`}>
              <span className="font-medium">{n.title}</span>
              <span className="text-muted-foreground"> — {n.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const FULL_WIDTH_WIDGETS: WidgetId[] = [
  'your_circle', 'trending_clips', 'daily_loop', 'constellations', 'featured_vtubers',
]

const WIDGET_COMPONENTS: Record<WidgetId, React.ComponentType> = {
  your_circle:          YourCircleWidget,
  trending_clips:       TrendingClipsWidget,
  daily_loop:           DailyLoopWidget,
  active_bets:          ActiveBetsWidget,
  constellations:       ConstellationsWidget,
  featured_vtubers:     FeaturedVTubersWidget,
  weekly_digest:        WeeklyDigestWidget,
  find_my_oshi:         FindMyOshiWidget,
  tag_validator:        TagValidatorWidget,
  leaderboard:          LeaderboardWidget,
  forums:               ForumsWidget,
  recent_notifications: NotificationsWidget,
  my_clips:             MyClipsWidget,
}

const CIRCLE_MIGRATION_KEY = 'vtvault_circle_widget_migrated'

function UserDashboard() {
  const { vtubers } = useVTubers()
  const { user } = useAuth()
  const { layout, addWidget, removeWidget, moveWidget, reset } = useDashboardLayout()
  const [circleCount, setCircleCount] = useState(0)
  const [profileStats, setProfileStats] = useState<{ bets_placed: number; tag_streak?: number } | null>(null)

  useEffect(() => {
    if (!user) return
    fetch('/api/your-circle', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { oshis: [] })
      .then(d => setCircleCount(d.oshis?.length ?? 0))
      .catch(() => setCircleCount(0))
    fetch(`/api/users/${user.username}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setProfileStats({ bets_placed: d.bets_placed ?? 0 }))
      .catch(() => {})
  }, [user])

  const role: AppRole | null = normalizeRole(user?.role ?? null)

  useEffect(() => {
    if (!role || typeof window === 'undefined') return
    try {
      if (localStorage.getItem(CIRCLE_MIGRATION_KEY)) return
      const saved = localStorage.getItem('vtvault_dashboard_layout')
      const current: WidgetId[] = saved ? JSON.parse(saved) : []
      if (!current.includes('your_circle')) {
        const next = ['your_circle', ...current]
        localStorage.setItem('vtvault_dashboard_layout', JSON.stringify(next))
        window.location.reload()
      }
      localStorage.setItem(CIRCLE_MIGRATION_KEY, '1')
    } catch { /* ignore */ }
  }, [role])
  const allowedIds = role ? ROLE_ALLOWED_WIDGETS[role] : ALL_WIDGETS.map(w => w.id)
  const availableWidgets = ALL_WIDGETS.filter(w => allowedIds.includes(w.id))
  const visibleLayout = layout.filter(id => allowedIds.includes(id))

  const resetRoleDefaults = () => {
    if (!role) { reset(); return }
    try {
      localStorage.setItem('vtvault_dashboard_layout', JSON.stringify(ROLE_DEFAULT_WIDGETS[role]))
      window.location.reload()
    } catch { reset() }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <GlitchHeading as="h1" className="text-xl font-bold text-vault-cream">
            Back in the Vault, {user?.username}
          </GlitchHeading>
          <p className="text-xs text-muted-foreground mt-0.5">
            {role ? `${role} view` : 'Your view'} · {vtubers.length} dossiers on file
          </p>
        </div>
        <DashboardCustomizer
          layout={visibleLayout}
          onAdd={addWidget}
          onRemove={removeWidget}
          onMove={moveWidget}
          onReset={resetRoleDefaults}
          availableWidgets={availableWidgets}
        />
      </div>

      <FirstRunChecklist
        circleCount={circleCount}
        betsPlaced={profileStats?.bets_placed ?? 0}
        tagStreak={profileStats?.tag_streak ?? 0}
      />

      {visibleLayout.length === 0 ? (
        <div className="vault-panel p-12 text-center">
          <p className="text-muted-foreground mb-4">Blank slate. Add some widgets or restore defaults.</p>
          <Button onClick={resetRoleDefaults} variant="vault">
            Restore defaults
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleLayout.map(widgetId => {
            const W = WIDGET_COMPONENTS[widgetId]
            if (!W) return null
            const full = FULL_WIDTH_WIDGETS.includes(widgetId)
            return (
              <div key={widgetId} className={full ? 'md:col-span-2' : undefined}>
                <W />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen" />
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <MarketingHome />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <section className="border-b border-border bg-vault-deep/50 vault-grain">
        <div className="container mx-auto px-4 py-3">
          <p className="text-sm text-muted-foreground font-mono text-xs uppercase tracking-wider">
            Dashboard · drag widgets in the customizer
          </p>
        </div>
      </section>
      <UserDashboard />
    </div>
  )
}


