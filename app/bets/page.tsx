'use client'

import { bets, getVTuberById } from '@/lib/mock-data'
import { Trophy, Clock, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

export default function BetsPage() {
  const openBets = bets.filter(b => b.status === 'open')
  const closedBets = bets.filter(b => b.status !== 'open')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-6 w-6 text-vault-gold" />
        <h1 className="text-2xl font-bold text-vault-cream">VTuberBets</h1>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-vault-cream mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-vault-gold" />
          Open Bets
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {openBets.map(bet => {
            const vtuber = bet.vtuberId ? getVTuberById(bet.vtuberId) : null
            const total = bet.options.reduce((s, o) => s + o.totalScraps, 0)
            return (
              <div key={bet.id} className="vault-card rounded-lg p-5">
                <div className="flex items-start gap-3 mb-3">
                  {vtuber && (
                    <Link href={`/vtuber/${vtuber.id}`}>
                      <img src={vtuber.avatarUrl} alt={vtuber.name} className="h-9 w-9 rounded-full border border-vault-bronze/40" />
                    </Link>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-vault-cream text-sm leading-snug">{bet.title}</h3>
                    {vtuber && <p className="text-xs text-muted-foreground mt-0.5">{vtuber.name}</p>}
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Open</Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{bet.description}</p>

                <div className="space-y-2 mb-3">
                  {bet.options.map(opt => {
                    const pct = total > 0 ? Math.round((opt.totalScraps / total) * 100) : 0
                    return (
                      <div key={opt.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-vault-cream">{opt.label}</span>
                          <span className="text-muted-foreground">{pct}% · {opt.totalScraps.toLocaleString()} scraps</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-vault-gold font-medium">{total.toLocaleString()} total scraps</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Ends {new Date(bet.endsAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {closedBets.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-vault-cream mb-4">Past Bets</h2>
          <div className="grid md:grid-cols-2 gap-4 opacity-70">
            {closedBets.map(bet => (
              <div key={bet.id} className="vault-card rounded-lg p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-vault-cream text-sm">{bet.title}</h3>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {bet.status === 'resolved' ? 'Resolved' : 'Closed'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{bet.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
