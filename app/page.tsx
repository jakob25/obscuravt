'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Compass, Film, Trophy, ArrowRight, TrendingUp, Clock, Sparkles, Heart, Search } from 'lucide-react'
import { useVTubers, useClips, useBets } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'
import { VibeTagList } from '@/components/common/vibe-tag'
import { ClipCard } from '@/components/common/clip-card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'
import { useDashboardLayout, DashboardCustomizer, ALL_WIDGETS, type WidgetId } from '@/components/common/dashboard-customizer'

// ── Individual widget components ──────────────────────────────────────

function TrendingClipsWidget() {
  const { clips, loading } = useClips()
  const top = [...clips].sort((a, b) => b.votes.up - a.votes.up).slice(0, 4)
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-vault-gold" />
          <h2 className="text-xl font-bold text-vault-cream">Trending Clips</h2>
        </div>
        <Link href="/clips" className="text-sm text-vault-gold hover:text-vault-amber flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="vault-card rounded-lg aspect-video animate-pulse bg-muted/30" />)}
        </div>
      ) : top.length === 0 ? (
        <p className="text-muted-foreground text-sm">No clips yet.</p>
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
    <section className="vault-card rounded-xl overflow-hidden">
      <div className="px-4 py-3.5 border-b border-border bg-vault-deep/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-vault-gold" />
          <h2 className="font-bold text-vault-cream">Active Bets</h2>
        </div>
        <Link href="/bets" className="text-xs text-vault-gold hover:text-vault-amber flex items-center gap-1">
          All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded animate-pulse bg-muted/30" />)}</div>
      ) : open.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">No active bets.</p>
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
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-vault-gold" />
          <h2 className="text-xl font-bold text-vault-cream">Constellations</h2>
        </div>
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
    <section className="vault-card rounded-xl p-5 bg-gradient-to-r from-vault-gold/8 to-vault-amber/5 border-vault-gold/20">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-vault-cream flex items-center gap-2">
          <span className="text-lg">🔄</span> Daily Loop
        </h2>
        {!user && (
          <Link href="/login" className="text-xs text-vault-gold hover:underline">Sign in to track</Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: '🎁', label: 'Daily Bonus', desc: '+250 scraps', href: '/my-profile' },
          { icon: '🏷️', label: 'Tag Validator', desc: 'Earn scraps', href: '/tag-validator' },
          { icon: '🎮', label: 'Silhouette', desc: 'Guess the VTuber', href: '/silhouette' },
          { icon: '🏆', label: 'Active Bets', desc: 'Place or vote', href: '/bets' },
        ].map(({ icon, label, desc, href }) => (
          <Link key={label} href={href}
            className="flex flex-col items-center p-3 rounded-xl bg-muted/20 border border-border hover:border-vault-gold/30 transition-all text-center group">
            <span className="text-2xl mb-1.5">{icon}</span>
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
          <h2 className="text-xl font-bold text-vault-cream">Discover Someone New</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Shuffled every load — no algorithm, no popularity bias</p>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map(v => {
            const c = constellations.find(c => c.id === v.category)
            return (
              <Link key={v.id} href={`/vtuber/${v.id}`}
                className="vault-card rounded-lg p-4 hover:border-vault-gold/30 transition-all group">
                <div className="flex items-start gap-3 mb-3">
                  <img src={v.avatarUrl} alt={v.name}
                    className="h-10 w-10 rounded-full border-2 border-vault-bronze/50 group-hover:border-vault-gold/50 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-vault-cream truncate group-hover:text-vault-gold transition-colors">{v.name}</h3>
                    {c && <p className="text-xs mt-0.5" style={{ color: c.color }}>{c.name}</p>}
                  </div>
                </div>
                {v.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{v.bio}</p>}
                <VibeTagList tagIds={v.vibeTags} size="sm" maxTags={3} />
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

function WeeklyDigestWidget() {
  return (
    <section className="vault-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-vault-cream flex items-center gap-2">📅 Weekly Digest</h2>
        <Link href="/weekly" className="text-xs text-vault-gold hover:text-vault-amber">View full →</Link>
      </div>
      <p className="text-sm text-muted-foreground">This week's top clips, bets, and endorsed creators.</p>
    </section>
  )
}

function FindMyOshiWidget() {
  return (
    <section className="vault-card rounded-xl p-5 bg-gradient-to-br from-vault-gold/5 to-vault-amber/5 border-vault-gold/20">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="h-5 w-5 text-vault-gold" />
        <h2 className="font-bold text-vault-cream">Find My Oshi</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">5 questions. Matched by vibe, not algorithm.</p>
      <Button asChild size="sm" className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
        <Link href="/find-my-oshi">Take the quiz <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
      </Button>
    </section>
  )
}

function TagValidatorWidget() {
  return (
    <section className="vault-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">⚡</span>
        <h2 className="font-bold text-vault-cream">Tag Validator</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Confirm or challenge vibe tags. Earn Vault Scraps every 10.</p>
      <Button asChild size="sm" variant="outline" className="border-vault-bronze/40 text-vault-cream hover:border-vault-gold/40">
        <Link href="/tag-validator">Start validating <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
      </Button>
    </section>
  )
}

function LeaderboardWidget() {
  return (
    <section className="vault-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-vault-cream flex items-center gap-2">📊 Leaderboard</h2>
        <Link href="/leaderboard" className="text-xs text-vault-gold hover:text-vault-amber">Full board →</Link>
      </div>
      <p className="text-sm text-muted-foreground">See who's topping the Vault Scraps charts this week.</p>
    </section>
  )
}

function ForumsWidget() {
  return (
    <section className="vault-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-vault-cream flex items-center gap-2">💬 Forums</h2>
        <Link href="/forums" className="text-xs text-vault-gold hover:text-vault-amber">Browse →</Link>
      </div>
      <p className="text-sm text-muted-foreground">Per-constellation discussion boards. 280 chars.</p>
    </section>
  )
}

function NotificationsWidget() {
  return (
    <section className="vault-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-vault-cream flex items-center gap-2">🔔 Notifications</h2>
        <Link href="/notifications" className="text-xs text-vault-gold hover:text-vault-amber">See all →</Link>
      </div>
      <p className="text-sm text-muted-foreground">Bet results, achievements, and CMDMI updates.</p>
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
}

// ── Main page ──────────────────────────────────────────────

export default function HomePage() {
  const { vtubers } = useVTubers()
  const { layout, addWidget, removeWidget, moveWidget, reset } = useDashboardLayout()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-vault-gold/8 via-transparent to-[#e056a0]/5 pointer-events-none" />
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-2xl mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-vault-cream mb-3 leading-tight">
              The creators the algorithm{' '}
              <span className="text-vault-gold">forgot to show you.</span>
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed mb-2">
              ObscuraVT is a discovery hub built around vibes, not views. Find VTubers by personality,
              content niche, or community tag — not subscriber count. Every clip links back to the
              creator. Every search rewards the niche.
            </p>
            <p className="text-sm text-muted-foreground/70">
              Works for solo indies, small groups, and light corpos. No contracts, no exclusives.
            </p>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
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

          {/* Value prop pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { icon: '🔧', text: 'Vibe-based discovery' },
              { icon: '🎬', text: 'Raw clips with timestamps' },
              { icon: '🏆', text: 'Community predictions' },
              { icon: '⚡', text: 'Daily habit loop' },
              { icon: '🌎', text: 'Drives views to creators' },
            ].map(({ icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/30 border border-border text-xs text-muted-foreground">
                <span>{icon}</span>{text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-muted-foreground">{vtubers.length} creators in the Archive</p>
          <DashboardCustomizer
            layout={layout}
            onAdd={addWidget}
            onRemove={removeWidget}
            onMove={moveWidget}
            onReset={reset}
          />
        </div>

        {layout.length === 0 ? (
          <div className="vault-card rounded-xl p-12 text-center">
            <p className="text-muted-foreground mb-4">Your dashboard is empty.</p>
            <Button onClick={reset} className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
              Restore defaults
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {layout.map(widgetId => {
              const W = WIDGET_COMPONENTS[widgetId]
              return W ? <W key={widgetId} /> : null
            })}
          </div>
        )}
      </div>
    </div>
  )
}
