'use client'

import { useBets } from '@/hooks/use-data'
import { Trophy, Clock, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default function BetsPage() {
  const { bets, loading } = useBets()

  const openBets = bets.filter(b => b.status === 'open')
  const closedBets = bets.filter(b => b.status !== 'open')

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-vault-gold" />
          <h1 className="text-2xl font-bold text-vault-cream">VTuberBets</h1>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="vault-card rounded-lg p-5 h-48 animate-pulse bg-muted/30" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-6 w-6 text-vault-gold" />
        <h1 className="text-2xl font-bold text-vault-cream">VTuberBets</h1>
      </div>

      {openBets.length === 0 && closedBets.length === 0 && (
        <p className="text-muted-foreground text-center py-20">No bets yet. Create the first one!</p>
      )}

      {openBets.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-vault-cream mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-vault-gold" />
            Open Bets
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {openBets.map(bet => {
              const total = bet.options.reduce((s, o) => s + o.totalScraps, 0)
              return (
                <div key={bet.id} className="vault-card rounded-lg p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-vault-cream text-sm leading-snug">{bet.title}</h3>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs shrink-0">Open</Badge>
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
                      {new Date(bet.endsAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

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
