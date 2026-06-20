'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Compass, Film, Trophy, ArrowRight, TrendingUp, Clock, Sparkles, Heart, Search } from 'lucide-react'
import { useVTubers, useClips, useBets } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'

export default function HomePage() {
  const { vtubers, loading: vtubersLoading } = useVTubers()
  const { clips, loading: clipsLoading } = useClips()
  const { bets, loading: betsLoading } = useBets()

  const trendingClips = [...clips]
    .sort((a, b) => (b.votes?.up || 0) - (a.votes?.up || 0))
    .slice(0, 4)

  const recentBets = [...bets]
    .filter(b => b.status === 'open')
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_0.5px,transparent_1px)] bg-[length:4px_4px]" />
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vault-gold/10 text-vault-gold text-sm mb-6">
            <Sparkles className="h-4 w-4" />
            Discover Your Next Oshi
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
            Find the VTubers<br />you\'ll actually love.
          </h1>
          
          <p className="max-w-md mx-auto text-xl text-white/70 mb-10">
            ObscuraVT helps you discover VTubers through vibe, clips, and community — not algorithms.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/discover">
              <Button size="lg" className="px-8 py-6 text-lg">
                Start Exploring <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/find-my-oshi">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-white/20">
                Find My Oshi
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-20">
        {/* Trending Clips */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-vault-gold" />
              <h2 className="text-2xl font-semibold">Trending Clips</h2>
            </div>
            <Link href="/clips" className="text-sm text-vault-cyan hover:underline flex items-center gap-1">
              Browse all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingClips.length > 0 ? (
              trendingClips.map((clip) => (
                <a 
                  key={clip.id} 
                  href={`https://www.youtube.com/watch?v=${clip.videoId}`}
                  target="_blank"
                  className="block group"
                >
                  <div className="aspect-video bg-vault-navy rounded-xl mb-3 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="font-medium text-sm line-clamp-2 group-hover:text-vault-gold transition-colors">
                        {clip.title}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-white/60 flex items-center gap-2">
                    <span>{clip.votes?.up || 0} ↑</span>
                    <span>•</span>
                    <span>{clip.platform}</span>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-4 text-center py-8 text-white/50">No clips yet</div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/discover" className="vault-card p-6 group hover:border-vault-gold/30 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <Compass className="h-8 w-8 text-vault-gold mb-4" />
                <h3 className="font-semibold text-xl mb-1">Discover</h3>
                <p className="text-sm text-white/70">Browse all VTubers by vibe and constellation.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-vault-gold transition-colors" />
            </div>
          </Link>

          <Link href="/find-my-oshi" className="vault-card p-6 group hover:border-vault-gold/30 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <Heart className="h-8 w-8 text-vault-gold mb-4" />
                <h3 className="font-semibold text-xl mb-1">Find Your Oshi</h3>
                <p className="text-sm text-white/70">Get personalized VTuber recommendations.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-vault-gold transition-colors" />
            </div>
          </Link>

          <Link href="/leaderboard" className="vault-card p-6 group hover:border-vault-gold/30 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <Trophy className="h-8 w-8 text-vault-gold mb-4" />
                <h3 className="font-semibold text-xl mb-1">Leaderboard</h3>
                <p className="text-sm text-white/70">See who\'s winning and losing.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-vault-gold transition-colors" />
            </div>
          </Link>
        </section>
      </div>
    </div>
  )
}
