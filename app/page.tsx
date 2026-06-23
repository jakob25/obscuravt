'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Compass, Film, Trophy, ArrowRight, TrendingUp, Clock, Sparkles, Heart, Search,
  Gift, Tag, Gamepad2, Calendar, Zap, BarChart3, MessageSquare, Bell, Globe, Wrench, RefreshCw,
} from 'lucide-react'
import { useVTubers, useClips, useBets } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'
import { VibeTagList } from '@/components/common/vibe-tag'
import { ClipCard } from '@/components/common/clip-card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'
import { useDashboardLayout, DashboardCustomizer, type WidgetId } from '@/components/common/dashboard-customizer'
import { GlitchHeading } from '@/components/vault/glitch-heading'

import { LogIn } from 'lucide-react'
import { MyClipsWidget } from '@/components/dashboard/my-clips-widget'
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
        <GlitchHeading as="h2" className="text-xl font-bold text-vault-cream">Clips worth stealing</GlitchHeading>
        <Link href="/clips" className="text-sm text-vault-gold hover:text-vault-amber flex items-center gap-1">
          All clips <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="vault-card rounded-lg aspect-video animate-pulse bg-muted/30" />)}
        </div>
      ) : top.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing clipped yet. Be the first heat.</p>
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
        <p className="p-4 text-sm text-muted-foreground">No wagers on the board. Start one.</p>
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
          <GlitchHeading as="h2" className="text-xl font-bold text-vault-cream">Someone you haven&apos;t met</GlitchHeading>
          <p className="text-xs text-muted-foreground mt-0.5">Shuffled every load. No ranking games.</p>
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
        <p className="text-sm text-muted-foreground animate-pulse">Pulling the tape…</p>
      ) : !digest ? (
        <p className="text-sm text-muted-foreground">Digest offline. Try again later.</p>
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
            <p className="text-muted-foreground">Dead air this week. Break the silence.</p>
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
  return (
    <section className="vault-panel">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-vault-cream">Notifications</h2>
        <Link href="/notifications" className="text-xs text-vault-gold hover:text-vault-amber">See all →</Link>
      </div>
      <p className="text-sm text-muted-foreground">Bets resolved, goals funded, ideas picked.</p>
    </section>
  )
}

const WIDGET_COMPONENTS: Record<WidgetId, React.ComponentType> = {
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

// ── Main page ──────────────────────────────────────────────

function LandingHero() {
  return (
    <section className="relative border-b border-border overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-vault-gold/8 via-transparent to-[#e056a0]/5 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212,168,67,0.4) 2px, rgba(212,168,67,0.4) 4px)' }} />
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-2xl mb-6">
          <GlitchHeading as="h1" className="text-3xl md:text-4xl font-bold text-vault-cream mb-3 leading-tight">
            The creators the algorithm{' '}
            <span className="text-vault-gold">forgot to show you.</span>
          </GlitchHeading>
            <p className="text-muted-foreground text-base leading-relaxed mb-2">
              ObscuraVT is a discovery hub built around vibes, not views. Find VTubers by personality,
              content niche, or community tag — not subscriber count. Every clip links back to the
              creator. Every search rewards the niche.
            </p>
            <p className="text-sm text-muted-foreground/70">
              Works for solo indies, small groups, and light corpos. No contracts, no exclusives.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Button asChild className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
              <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Sign In to Enter the Vault</Link>
            </Button>
            <Button asChild className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
              <Link href="/discover"><Compass className="mr-2 h-4 w-4" />Explore Star Map</Link>
            </Button>
            <Button asChild variant="outline" className="border-vault-bronze/50 text-vault-cream hover:bg-vault-bronze/10">
              <Link href="/find-my-oshi"><Heart className="mr-2 h-4 w-4" />Find My Oshi</Link>
            </Button>
            <Button asChild variant="outline" className="border-vault-bronze/50 text-vault-cream hover:bg-vault-bronze/10">
              <Link href="/clips"><Film className="mr-2 h-4 w-4" />Raw Clips</Link>
            </Button>
            <Button asChild variant="outline" className="border-vault-bronze/50 text-vault-cream hover:bg-vault-bronze/10">
              <Link href="/search"><Search className="mr-2 h-4 w-4" />Search</Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { Icon: Wrench, text: 'Vibe-based discovery' },
              { Icon: Film, text: 'Raw clips with timestamps' },
              { Icon: Trophy, text: 'Community predictions' },
              { Icon: Zap, text: 'Daily habit loop' },
              { Icon: Globe, text: 'Drives views to creators' },
            ].map(({ Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/30 border border-border text-xs text-muted-foreground">
                <Icon className="h-3 w-3 text-vault-gold" />{text}
              </span>
            ))}
          </div>
      </div>
    </section>
  )
}

function UserDashboard() {
  const { vtubers } = useVTubers()
  const { user } = useAuth()
  const { layout, addWidget, removeWidget, moveWidget, reset } = useDashboardLayout()

  const role: AppRole | null = normalizeRole(user?.role ?? null)
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

      {visibleLayout.length === 0 ? (
        <div className="vault-panel p-12 text-center">
          <p className="text-muted-foreground mb-4">Blank slate. Add some widgets or restore defaults.</p>
          <Button onClick={resetRoleDefaults} variant="vault">
            Restore defaults
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {visibleLayout.map(widgetId => {
            const W = WIDGET_COMPONENTS[widgetId]
            return W ? <W key={widgetId} /> : null
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
        <LandingHero />
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
