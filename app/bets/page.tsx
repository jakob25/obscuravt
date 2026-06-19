import { useState, useCallback } from 'react'
import { useBets } from '@/hooks/use-data'
import { useAuth } from '@/lib/auth-context'
import { Trophy, Clock, TrendingUp, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Vote } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function BetsPage() {
  const { bets, loading, placeBet } = useBets()
  const { user } = useAuth()
  const [selectedOption, setSelectedOption] = useState<Record<string, string | number>>({})
  const [betting, setBetting] = useState<Record<string, boolean>>({})

  const handleBet = useCallback(async (betId: string) => {
    if (!user || !selectedOption[betId]) return

    setBetting(prev => ({ ...prev, [betId]: true }))

    try {
      await placeBet(betId, selectedOption[betId])
      // Refresh will happen via the hook
    } catch (error) {
      console.error('Bet placement failed:', error)
    } finally {
      setBetting(prev => ({ ...prev, [betId]: false }))
    }
  }, [user, selectedOption, placeBet])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-vault-gold" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="h-8 w-8 text-vault-gold" />
        <h1 className="text-4xl font-bold">Bets</h1>
      </div>

      {bets.length === 0 ? (
        <div className="vault-card p-12 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-white/30" />
          <h3 className="text-xl font-semibold mb-2">No active bets</h3>
          <p className="text-white/60">Check back later for new betting opportunities.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bets.map((bet) => {
            const isOpen = bet.status === 'open'
            const userSelection = selectedOption[bet.id]
            const isBetting = betting[bet.id]

            return (
              <div key={bet.id} className="vault-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{bet.title}</h3>
                    {bet.description && (
                      <p className="text-white/70 text-sm">{bet.description}</p>
                    )}
                  </div>
                  <Badge variant={isOpen ? 'default' : 'secondary'}>
                    {isOpen ? 'Open' : 'Closed'}
                  </Badge>
                </div>

                {isOpen && bet.endsAt && (
                  <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Ends {new Date(bet.endsAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  {bet.options.map((option) => {
                    const isSelected = userSelection === option.id
                    const percentage = option.totalScraps > 0 
                      ? Math.round((option.totalScraps / bet.options.reduce((sum, o) => sum + o.totalScraps, 0)) * 100) 
                      : 0

                    return (
                      <button
                        key={option.id}
                        onClick={() => isOpen && setSelectedOption(prev => ({ ...prev, [bet.id]: option.id }))}
                        disabled={!isOpen}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? 'border-vault-gold bg-vault-gold/10' 
                            : 'border-white/10 hover:border-white/30'
                        } ${!isOpen ? 'opacity-60' : ''}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{option.label}</span>
                          <div className="text-right">
                            <div className="font-mono text-sm">{option.totalScraps} scraps</div>
                            {option.odds && (
                              <div className="text-xs text-white/50">{option.odds.toFixed(2)}x</div>
                            )}
                          </div>
                        </div>
                        {option.totalScraps > 0 && (
                          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-vault-gold transition-all" 
                              style={{ width: `${percentage}%` }} 
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {isOpen && user && (
                  <button
                    onClick={() => handleBet(bet.id)}
                    disabled={!userSelection || isBetting}
                    className="w-full py-3 bg-vault-gold text-vault-deep rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-[#e8bc5a] transition-colors"
                  >
                    {isBetting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Placing bet...
                      </>
                    ) : (
                      <>
                        <Vote className="h-4 w-4" /> Place Bet
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
