'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Compass, Film, Trophy, ArrowRight, TrendingUp, Clock, Sparkles } from 'lucide-react'
import { useVTubers, useClips, useBets } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'
import { VibeTagList } from '@/components/common/vibe-tag'

export default function HomePage() {
  const { vtubers, loading: vtLoading } = useVTubers()
  const { clips, loading: clipsLoading } = useClips()
  const { bets, loading: betsLoading } = useBets()
  const { constellations } = useStarMapData()

  const trendingClips = [...clips].sort((a, b) => b.votes.up - a.votes.up).slice(0, 4)
  const activeBets = bets.filter(b => b.status === 'open').slice(0, 3)
  const featuredVTubers = [...vtubers].filter(v => v.scraps > 0 || true).slice(0, 6)
  const recentVTuber = vtubers[vtubers.length - 1]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-vault-gold/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-vault-cream mb-2">Welcome to the Vault</h1>
              <p className="text-muted-foreground">Discover VTubers by vibe, explore raw clips, place friendly bets.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
                <Link href="/discover"><Compass className="mr-2 h-4 w-4" />Star Map</Link>
              </Button>
              <Button asChild variant="outline" className="border-vault-bronze/50 text-vault-cream hover:bg-vault-bronze/10">
                <Link href="/clips"><Film className="mr-2 h-4 w-4" />Clips</Link>
              </Button>
              <Button asChild variant="outline" className="border-vault-bronze/50 text-vault-cream hover:bg-vault-bronze/10">
                <Link href="/bets"><Trophy className="mr-2 h-4 w-4" />Bets</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* Trending Clips */}
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
              {clipsLoading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[1,2,3,4].map(i => <div key={i} className="vault-card rounded-lg aspect-video animate-pulse bg-muted/30" />)}
                </div>
              ) : trendingClips.length === 0 ? (
                <p className="text-muted-foreground text-sm">No clips yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {trendingClips.map((clip) => (
                    <Link key={clip.id} href={`/clips?clip=${clip.id}`}
                      className="vault-card rounded-lg overflow-hidden hover:border-vault-gold/30 transition-all group">
                      <div className="aspect-video bg-vault-deep relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Film className="h-8 w-8 text-vault-bronze/50" />
                        </div>
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            clip.type === 'raw'
                              ? 'bg-vault-gold/20 text-vault-gold border border-vault-gold/30'
                              : 'bg-vault-amber/20 text-vault-amber border border-vault-amber/30'
                          }`}>{clip.type === 'raw' ? 'Raw' : 'Edited'}</span>
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-vault-deep/80 text-xs text-vault-cream">
                          {clip.votes.up.toLocaleString()} upvotes
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-vault-cream text-sm line-clamp-2 group-hover:text-vault-gold transition-colors">
                          {clip.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Constellations */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-vault-gold" />
                  <h2 className="text-xl font-bold text-vault-cream">Constellations</h2>
                </div>
                <Link href="/discover" className="text-sm text-vault-gold hover:text-vault-amber flex items-center gap-1">
                  Open Map <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {constellations.slice(0, 9).map((c) => (
                  <Link key={c.id} href={`/discover?constellation=${c.id}`}
                    className="vault-card rounded-lg p-4 hover:border-vault-gold/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full star-glow flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <div className="min-w-0">
                        <h3 className="font-medium text-vault-cream text-sm group-hover:text-vault-gold transition-colors truncate">{c.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Featured VTubers */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-vault-cream">Featured Creators</h2>
                <Link href="/discover" className="text-sm text-vault-gold hover:text-vault-amber flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {vtLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="vault-card rounded-lg p-4 h-32 animate-pulse bg-muted/30" />)}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredVTubers.map((vtuber) => (
                    <Link key={vtuber.id} href={`/vtuber/${vtuber.id}`}
                      className="vault-card rounded-lg p-4 hover:border-vault-gold/30 transition-all group">
                      <div className="flex items-start gap-3 mb-3">
                        <img src={vtuber.avatarUrl} alt={vtuber.name}
                          className="h-10 w-10 rounded-full border-2 border-vault-bronze/50 group-hover:border-vault-gold/50 transition-colors" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-vault-cream truncate group-hover:text-vault-gold transition-colors">
                            {vtuber.name}
                          </h3>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{vtuber.bio}</p>
                      <VibeTagList tagIds={vtuber.vibeTags} size="sm" maxTags={3} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Bets */}
            <section className="vault-card rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border bg-vault-deep/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-vault-gold" />
                    <h2 className="font-bold text-vault-cream">Active Bets</h2>
                  </div>
                  <Link href="/bets" className="text-xs text-vault-gold hover:text-vault-amber flex items-center gap-1">
                    All bets <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              {betsLoading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded animate-pulse bg-muted/30" />)}
                </div>
              ) : activeBets.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No active bets right now.</p>
              ) : (
                <div className="divide-y divide-border">
                  {activeBets.map((bet) => {
                    const totalPool = bet.options.reduce((sum, opt) => sum + opt.totalScraps, 0)
                    return (
                      <Link key={bet.id} href={`/bets?bet=${bet.id}`}
                        className="block p-4 hover:bg-vault-bronze/5 transition-colors">
                        <h3 className="font-medium text-vault-cream text-sm line-clamp-2 mb-2">{bet.title}</h3>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-vault-gold font-medium">{totalPool.toLocaleString()} Scraps</span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />{bet.options.length} options
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Stats */}
            <section className="vault-card rounded-lg p-4">
              <h3 className="font-bold text-vault-cream mb-4">Vault Stats</h3>
              <div className="space-y-3">
                {[
                  { label: 'VTubers', value: vtLoading ? '…' : vtubers.length },
                  { label: 'Clips', value: clipsLoading ? '…' : clips.length },
                  { label: 'Active Bets', value: betsLoading ? '…' : activeBets.length },
                  { label: 'Constellations', value: constellations.length || '…' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium text-vault-cream">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Recently Added */}
            {recentVTuber && (
              <section className="vault-card rounded-lg p-4">
                <h3 className="font-bold text-vault-cream mb-3">Recently Added</h3>
                <Link href={`/vtuber/${recentVTuber.id}`} className="flex items-center gap-3 group">
                  <img src={recentVTuber.avatarUrl} alt={recentVTuber.name}
                    className="h-12 w-12 rounded-full border-2 border-vault-bronze/50 group-hover:border-vault-gold/50 transition-colors" />
                  <div>
                    <h4 className="font-medium text-vault-cream group-hover:text-vault-gold transition-colors">{recentVTuber.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{recentVTuber.bio}</p>
                  </div>
                </Link>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}