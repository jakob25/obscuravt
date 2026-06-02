'use client'

import { useEffect, useState } from 'react'
import { Trophy, TrendingUp, TrendingDown, Target } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface RichRow { username: string; coins: number; total_won: number; bets_placed: number; bets_correct: number }
interface AccurateRow { username: string; bets_placed: number; bets_correct: number; pct: number }
interface LoserRow { username: string; total_lost: number; biggest_loss: number }

export default function LeaderboardPage() {
  const [rich, setRich] = useState<RichRow[]>([])
  const [accurate, setAccurate] = useState<AccurateRow[]>([])
  const [losers, setLosers] = useState<LoserRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/leaderboard?type=rich').then(r => r.json()),
      fetch('/api/leaderboard?type=accurate').then(r => r.json()),
      fetch('/api/leaderboard?type=losers').then(r => r.json()),
    ]).then(([r, a, l]) => {
      setRich(r); setAccurate(a); setLosers(l); setLoading(false)
    })
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-6 w-6 text-vault-gold" />
        <h1 className="text-2xl font-bold text-vault-cream">Leaderboard</h1>
      </div>

      <Tabs defaultValue="rich">
        <TabsList className="mb-6 bg-muted/50">
          <TabsTrigger value="rich" className="data-[state=active]:bg-vault-gold/20 data-[state=active]:text-vault-gold">
            <TrendingUp className="h-4 w-4 mr-1" /> Richest
          </TabsTrigger>
          <TabsTrigger value="accurate" className="data-[state=active]:bg-vault-gold/20 data-[state=active]:text-vault-gold">
            <Target className="h-4 w-4 mr-1" /> Most Accurate
          </TabsTrigger>
          <TabsTrigger value="losers" className="data-[state=active]:bg-vault-gold/20 data-[state=active]:text-vault-gold">
            <TrendingDown className="h-4 w-4 mr-1" /> Hall of Loss
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rich">
          <div className="vault-card rounded-xl overflow-hidden">
            {loading ? <Skeleton /> : rich.map((row, i) => (
              <div key={row.username} className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-0 hover:bg-vault-bronze/5 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{medals[i] ?? `${i + 1}.`}</span>
                  <div>
                    <Link href={`/user/${row.username}`} className="font-semibold text-vault-cream hover:text-vault-gold transition-colors">{row.username}</Link>
                    <p className="text-xs text-muted-foreground">{row.bets_correct}/{row.bets_placed} correct</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-vault-gold">{row.coins.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Vault Scraps</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accurate">
          <div className="vault-card rounded-xl overflow-hidden">
            {loading ? <Skeleton /> : accurate.map((row, i) => (
              <div key={row.username} className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-0 hover:bg-vault-bronze/5 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{medals[i] ?? `${i + 1}.`}</span>
                  <div>
                    <Link href={`/user/${row.username}`} className="font-semibold text-vault-cream hover:text-vault-gold transition-colors">{row.username}</Link>
                    <p className="text-xs text-muted-foreground">{row.bets_placed} bets placed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-vault-gold">{(row.pct * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">accuracy</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="losers">
          <div className="vault-card rounded-xl overflow-hidden">
            {loading ? <Skeleton /> : losers.map((row, i) => (
              <div key={row.username} className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-0 hover:bg-vault-bronze/5 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{i === 0 ? '💀' : `${i + 1}.`}</span>
                  <div>
                    <Link href={`/user/${row.username}`} className="font-semibold text-vault-cream hover:text-vault-gold transition-colors">{row.username}</Link>
                    <p className="text-xs text-muted-foreground">Biggest single loss: {row.biggest_loss.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-400">{row.total_lost.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">lost total</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
      ))}
    </div>
  )
}
