'use client'

import { useEffect, useState } from 'react'
import { Calendar, Film, Trophy, Star, Zap, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { WeeklyDigest } from '@/lib/types'

function getMondayDate() {
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function WeeklyPage() {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/weekly').then(r => r.json()).then(d => { setDigest(d); setLoading(false) })
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Calendar className="h-6 w-6 text-vault-gold" />
        <h1 className="text-2xl font-bold text-vault-cream">Weekly Digest</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Week of {getMondayDate()} · Resets every Monday
      </p>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="vault-card rounded-xl p-5 h-32 animate-pulse bg-muted/20" />)}
        </div>
      ) : !digest ? (
        <p className="text-muted-foreground text-center py-12">No data available yet.</p>
      ) : (
        <div className="space-y-6">

          {/* Top Clips */}
          <section className="vault-card rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
              <Film className="h-4 w-4 text-vault-gold" />
              <h2 className="font-bold text-vault-cream">Top Clips This Week</h2>
            </div>
            {digest.topClips.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No clips submitted this week yet.</p>
            ) : (
              digest.topClips.map((clip, i) => (
                <div key={clip.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                  <span className="text-xl w-8 text-center flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-vault-cream text-sm truncate">{clip.title}</p>
                    <p className="text-xs text-muted-foreground">{clip.vtuber_name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-vault-gold font-medium">↑{clip.upvotes}</span>
                    <a href={clip.clip_url} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-vault-cream transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Top Bet */}
          {digest.topBet && (
            <section className="vault-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-vault-gold" />
                <h2 className="font-bold text-vault-cream">Most Active Bet</h2>
              </div>
              <p className="text-sm text-vault-cream mb-1">{digest.topBet.title}</p>
              <p className="text-xs text-muted-foreground">{digest.topBet.entries} entries placed this week</p>
              <Link href="/bets" className="text-xs text-vault-gold hover:underline mt-2 inline-block">View bet →</Link>
            </section>
          )}

          {/* Top New VTuber */}
          {digest.topVtuber && (
            <section className="vault-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-vault-gold" />
                <h2 className="font-bold text-vault-cream">Most Endorsed New Creator</h2>
              </div>
              <p className="text-sm text-vault-cream mb-1">{digest.topVtuber.name}</p>
              <p className="text-xs text-muted-foreground">{digest.topVtuber.endorsements} endorsements this week</p>
              <Link href={`/vtuber/${digest.topVtuber.id}`} className="text-xs text-vault-gold hover:underline mt-2 inline-block">
                View profile →
              </Link>
            </section>
          )}

          {/* Top CMDMI */}
          {digest.topCmdmi && (
            <section className="vault-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-vault-gold" />
                <h2 className="font-bold text-vault-cream">Biggest CMDMI Goal Funded</h2>
              </div>
              <p className="text-sm text-vault-cream mb-1">"{digest.topCmdmi.idea_title}"</p>
              <p className="text-xs text-muted-foreground mb-1">by {digest.topCmdmi.vtuber_name}</p>
              <p className="text-xs text-vault-gold font-medium">
                {digest.topCmdmi.funded_amount.toLocaleString()} / {digest.topCmdmi.goal_amount.toLocaleString()} scraps funded
              </p>
            </section>
          )}

          {!digest.topBet && !digest.topVtuber && !digest.topCmdmi && digest.topClips.length === 0 && (
            <div className="vault-card rounded-xl p-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-vault-cream font-medium mb-1">Fresh week, empty digest</p>
              <p className="text-sm text-muted-foreground">Submit clips, place bets, and endorse VTubers to populate this week's digest.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
