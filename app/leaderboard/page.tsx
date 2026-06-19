'use client'

import { useEffect, useState } from 'react'
import { Trophy, TrendingDown, User } from 'lucide-react'

interface LeaderboardUser {
  username: string
  coins: number
  account_type: string | null
}

export default function LeaderboardPage() {
  const [winners, setWinners] = useState<LeaderboardUser[]>([])
  const [losers, setLosers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard')
        if (res.ok) {
          const data = await res.json()
          setWinners(data.winners || [])
          setLosers(data.losers || [])
        }
      } catch (err) {
        console.error('Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return <div className="p-8 text-center">Loading leaderboard...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
        <Trophy className="h-9 w-9 text-vault-gold" />
        Leaderboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Biggest Winners */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-6 w-6 text-vault-gold" />
            <h2 className="text-2xl font-semibold">Biggest Winners</h2>
          </div>

          <div className="space-y-3">
            {winners.length === 0 ? (
              <div className="vault-card p-6 text-center text-white/60">
                No data yet
              </div>
            ) : (
              winners.map((user, index) => (
                <div key={user.username} className="vault-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center font-mono text-white/50">#{index + 1}</div>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-vault-navy flex items-center justify-center">
                        <User className="h-4 w-4 text-vault-gold" />
                      </div>
                      <div>
                        <div className="font-medium">@{user.username}</div>
                        <div className="text-xs text-white/50 capitalize">{user.account_type || 'user'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl text-vault-gold">{user.coins}</div>
                    <div className="text-xs text-white/50">coins</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Biggest Losers */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="h-6 w-6 text-red-400" />
            <h2 className="text-2xl font-semibold">Biggest Losers</h2>
          </div>

          <div className="space-y-3">
            {losers.length === 0 ? (
              <div className="vault-card p-6 text-center text-white/60">
                No data yet
              </div>
            ) : (
              losers.map((user, index) => (
                <div key={user.username} className="vault-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center font-mono text-white/50">#{index + 1}</div>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-vault-navy flex items-center justify-center">
                        <User className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <div className="font-medium">@{user.username}</div>
                        <div className="text-xs text-white/50 capitalize">{user.account_type || 'user'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl text-red-400">{user.coins}</div>
                    <div className="text-xs text-white/50">coins</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-white/50 text-sm mt-10">
        Leaderboard updates periodically based on coin balance.
      </p>
    </div>
  )
}
