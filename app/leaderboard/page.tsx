'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Target } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultDivider, VaultPanel, StatCard } from '@/components/vault/vault-surfaces'

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
      fetch('/api/leaderboard?type=rich').then(r => r.json()).catch(() => []),
      fetch('/api/leaderboard?type=accurate').then(r => r.json()).catch(() => []),
      fetch('/api/leaderboard?type=losers').then(r => r.json()).catch(() => []),
    ]).then(([r, a, l]) => {
      setRich(r); setAccurate(a); setLosers(l); setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const medals = ['I', 'II', 'III']

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-1">Leaderboard</GlitchHeading>
      <p className="text-sm text-muted-foreground mb-4">Who&apos;s swimming in scraps — and who donated to the pool.</p>
      <VaultDivider className="mb-6" />

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
          {!loading && rich[0] && (
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <StatCard featured label="Vault King" value={rich[0].username} />
              <StatCard featured label="Scraps" value={rich[0].coins.toLocaleString()} />
            </div>
          )}
          <VaultPanel className="overflow-hidden">
            {loading ? <Skeleton /> : rich.map((row, i) => (
              <div key={row.username} className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-0 hover:bg-vault-bronze/5 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-sm w-8 text-center font-mono ${i < 3 ? 'text-vault-gold font-bold' : 'text-muted-foreground'}`}>{medals[i] ?? `${i + 1}.`}</span>
                  <div>
                    <p className="font-semibold text-vault-cream">{row.username}</p>
                    <p className="text-xs text-muted-foreground">{row.bets_correct}/{row.bets_placed} correct</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-vault-gold tabular-nums">{row.coins.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">scraps</p>
                </div>
              </div>
            ))}
          </VaultPanel>
        </TabsContent>

        <TabsContent value="accurate">
          {!loading && accurate[0] && (
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <StatCard featured label="Sharpest Caller" value={accurate[0].username} />
              <StatCard featured label="Accuracy" value={`${(accurate[0].pct * 100).toFixed(1)}%`} />
            </div>
          )}
          <VaultPanel className="overflow-hidden">
            {loading ? <Skeleton /> : accurate.map((row, i) => (
              <div key={row.username} className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-0 hover:bg-vault-bronze/5 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-sm w-8 text-center font-mono ${i < 3 ? 'text-vault-gold font-bold' : 'text-muted-foreground'}`}>{medals[i] ?? `${i + 1}.`}</span>
                  <div>
                    <p className="font-semibold text-vault-cream">{row.username}</p>
                    <p className="text-xs text-muted-foreground">{row.bets_placed} bets placed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-vault-gold">{(row.pct * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">accuracy</p>
                </div>
              </div>
            ))}
          </VaultPanel>
        </TabsContent>

        <TabsContent value="losers">
          {!loading && losers[0] && (
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <StatCard featured label="Biggest Donor" value={losers[0].username} />
              <StatCard featured label="Total Lost" value={losers[0].total_lost.toLocaleString()} />
            </div>
          )}
          <VaultPanel className="overflow-hidden">
            {loading ? <Skeleton /> : losers.map((row, i) => (
              <div key={row.username} className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-0 hover:bg-vault-bronze/5 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-sm w-8 text-center font-mono ${i === 0 ? 'text-red-400 font-bold' : 'text-muted-foreground'}`}>{i === 0 ? '†' : `${i + 1}.`}</span>
                  <div>
                    <p className="font-semibold text-vault-cream">{row.username}</p>
                    <p className="text-xs text-muted-foreground">Biggest single loss: {row.biggest_loss.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-400 tabular-nums">{row.total_lost.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">lost total</p>
                </div>
              </div>
            ))}
          </VaultPanel>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
      ))}
    </div>
  )
}