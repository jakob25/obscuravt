import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Compass, Film, Trophy, ArrowRight, TrendingUp, Clock, Sparkles } from 'lucide-react'
import { vtubers, clips, bets, getVTuberById, constellations } from '@/lib/mock-data'
import { VibeTagList } from '@/components/common/vibe-tag'

export default function HomePage() {
  // Get trending clips (sorted by upvotes)
  const trendingClips = [...clips]
    .sort((a, b) => b.votes.up - a.votes.up)
    .slice(0, 4)

  // Get active bets
  const activeBets = bets.filter(b => b.status === 'open').slice(0, 3)

  // Get featured VTubers (top by scraps)
  const featuredVTubers = [...vtubers]
    .sort((a, b) => (b.scraps || 0) - (a.scraps || 0))
    .slice(0, 6)

  return (
    <div className="min-h-screen">
      {/* Compact Hero - Quick access, not a sales pitch */}
      <section className="relative border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-vault-gold/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-vault-cream mb-2">
                Welcome to the Vault
              </h1>
              <p className="text-muted-foreground">
                Discover VTubers by vibe, explore raw clips, place friendly bets.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                asChild 
                className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold"
              >
                <Link href="/discover">
                  <Compass className="mr-2 h-4 w-4" />
                  Star Map
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline"
                className="border-vault-bronze/50 text-vault-cream hover:bg-vault-bronze/10"
              >
                <Link href="/clips">
                  <Film className="mr-2 h-4 w-4" />
                  Clips
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline"
                className="border-vault-bronze/50 text-vault-cream hover:bg-vault-bronze/10"
              >
                <Link href="/bets">
                  <Trophy className="mr-2 h-4 w-4" />
                  Bets
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Trending Clips */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-vault-gold" />
                  <h2 className="text-xl font-bold text-vault-cream">Trending Clips</h2>
                </div>
                <Link 
                  href="/clips" 
                  className="text-sm text-vault-gold hover:text-vault-amber flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {trendingClips.map((clip) => {
                  const vtuber = getVTuberById(clip.vtuberId)
                  return (
                    <Link
                      key={clip.id}
                      href={`/clips?clip=${clip.id}`}
                      className="vault-card rounded-lg overflow-hidden hover:border-vault-gold/30 transition-all group"
                    >
                      {/* Thumbnail placeholder */}
                      <div className="aspect-video bg-vault-deep relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Film className="h-8 w-8 text-vault-bronze/50" />
                        </div>
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            clip.type === 'raw' 
                              ? 'bg-vault-gold/20 text-vault-gold border border-vault-gold/30' 
                              : 'bg-vault-amber/20 text-vault-amber border border-vault-amber/30'
                          }`}>
                            {clip.type === 'raw' ? 'Raw' : 'Edited'}
                          </span>
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-vault-deep/80 text-xs text-vault-cream">
                          {clip.votes.up.toLocaleString()} upvotes
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-vault-cream text-sm line-clamp-2 group-hover:text-vault-gold transition-colors mb-2">
                          {clip.title}
                        </h3>
                        {vtuber && (
                          <div className="flex items-center gap-2">
                            <img
                              src={vtuber.avatarUrl}
                              alt={vtuber.name}
                              className="h-5 w-5 rounded-full border border-vault-bronze/30"
                            />
                            <span className="text-xs text-muted-foreground">{vtuber.name}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* Quick Constellation Access */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-vault-gold" />
                  <h2 className="text-xl font-bold text-vault-cream">Constellations</h2>
                </div>
                <Link 
                  href="/discover" 
                  className="text-sm text-vault-gold hover:text-vault-amber flex items-center gap-1"
                >
                  Open Map <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {constellations.map((constellation) => (
                  <Link
                    key={constellation.id}
                    href={`/discover?constellation=${constellation.id}`}
                    className="vault-card rounded-lg p-4 hover:border-vault-gold/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-3 w-3 rounded-full star-glow flex-shrink-0"
                        style={{ backgroundColor: constellation.color }}
                      />
                      <div className="min-w-0">
                        <h3 className="font-medium text-vault-cream text-sm group-hover:text-vault-gold transition-colors truncate">
                          {constellation.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {constellation.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Featured VTubers Grid */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-vault-cream">Featured Creators</h2>
                <Link 
                  href="/discover" 
                  className="text-sm text-vault-gold hover:text-vault-amber flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredVTubers.map((vtuber) => (
                  <Link
                    key={vtuber.id}
                    href={`/vtuber/${vtuber.id}`}
                    className="vault-card rounded-lg p-4 hover:border-vault-gold/30 transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={vtuber.avatarUrl}
                        alt={vtuber.name}
                        className="h-10 w-10 rounded-full border-2 border-vault-bronze/50 group-hover:border-vault-gold/50 transition-colors"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-vault-cream truncate group-hover:text-vault-gold transition-colors">
                            {vtuber.name}
                          </h3>
                          {vtuber.isWorkerVTuber && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-vault-bronze/20 text-vault-bronze border border-vault-bronze/30">
                              Worker
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{vtuber.timezone}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {vtuber.bio}
                    </p>
                    <VibeTagList tagIds={vtuber.vibeTags} size="sm" maxTags={3} />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar - Active Bets */}
          <div className="space-y-6">
            <section className="vault-card rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border bg-vault-deep/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-vault-gold" />
                    <h2 className="font-bold text-vault-cream">Active Bets</h2>
                  </div>
                  <Link 
                    href="/bets" 
                    className="text-xs text-vault-gold hover:text-vault-amber flex items-center gap-1"
                  >
                    All bets <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-border">
                {activeBets.map((bet) => {
                  const vtuber = bet.vtuberId ? getVTuberById(bet.vtuberId) : undefined
                  const totalPool = bet.options.reduce((sum, opt) => sum + opt.totalScraps, 0)
                  return (
                    <Link
                      key={bet.id}
                      href={`/bets?bet=${bet.id}`}
                      className="block p-4 hover:bg-vault-bronze/5 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        {vtuber && (
                          <img
                            src={vtuber.avatarUrl}
                            alt={vtuber.name}
                            className="h-8 w-8 rounded-full border border-vault-bronze/30"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-vault-cream text-sm line-clamp-2">
                            {bet.title}
                          </h3>
                          {vtuber && (
                            <p className="text-xs text-muted-foreground mt-0.5">{vtuber.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-vault-gold font-medium">
                          {totalPool.toLocaleString()} Scraps
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {bet.options.length} options
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* Quick Stats */}
            <section className="vault-card rounded-lg p-4">
              <h3 className="font-bold text-vault-cream mb-4">Vault Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">VTubers</span>
                  <span className="text-sm font-medium text-vault-cream">{vtubers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Clips</span>
                  <span className="text-sm font-medium text-vault-cream">{clips.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Bets</span>
                  <span className="text-sm font-medium text-vault-cream">{activeBets.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Constellations</span>
                  <span className="text-sm font-medium text-vault-cream">{constellations.length}</span>
                </div>
              </div>
            </section>

            {/* Recently Added VTuber */}
            <section className="vault-card rounded-lg p-4">
              <h3 className="font-bold text-vault-cream mb-3">Recently Added</h3>
              {vtubers.slice(-1).map((vtuber) => (
                <Link
                  key={vtuber.id}
                  href={`/vtuber/${vtuber.id}`}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src={vtuber.avatarUrl}
                    alt={vtuber.name}
                    className="h-12 w-12 rounded-full border-2 border-vault-bronze/50 group-hover:border-vault-gold/50 transition-colors"
                  />
                  <div>
                    <h4 className="font-medium text-vault-cream group-hover:text-vault-gold transition-colors">
                      {vtuber.name}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{vtuber.bio}</p>
                  </div>
                </Link>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
