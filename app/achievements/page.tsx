'use client'

import { useEffect, useState } from 'react'
import { Medal } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface Achievement {
  id: string
  name: string
  description: string
  reward_coins: number
  icon: string
}

interface Badge { achievement_id: string; earned_at: string }

export default function AchievementsPage() {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [badges, setBadges] = useState<Badge[]>([])

  useEffect(() => {
    const url = user
      ? `/api/achievements?username=${user.username}`
      : '/api/achievements'
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.achievements) {
          setAchievements(data.achievements)
          setBadges(data.badges ?? [])
        } else {
          setAchievements(data)
        }
      })
      .catch(() => {
        // graceful: leave empty, UI shows loading hint
      })
  }, [user])

  const earnedIds = new Set(badges.map(b => b.achievement_id))

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Medal className="h-6 w-6 text-vault-gold" />
        <h1 className="text-2xl font-bold text-vault-cream">Achievements</h1>
      </div>
      {user && (
        <p className="text-sm text-muted-foreground mb-6">
          {badges.length}/{achievements.length} earned
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {achievements.map(a => {
          const earned = earnedIds.has(a.id)
          const badge = badges.find(b => b.achievement_id === a.id)
          return (
            <div
              key={a.id}
              className={`vault-card rounded-xl p-4 transition-all ${earned ? 'border-vault-gold/40' : 'opacity-60'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{a.icon ?? '🏆'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-vault-cream">{a.name}</h3>
                    {earned && <span className="text-xs text-vault-gold">✓ Earned</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{a.description}</p>
                  {a.reward_coins > 0 && (
                    <p className="text-xs text-vault-amber">+{a.reward_coins.toLocaleString()} V-Coins reward</p>
                  )}
                  {badge && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {achievements.length === 0 && (
          <p className="text-muted-foreground col-span-2 text-center py-12">
            Achievements loading... (configure Supabase to populate)
          </p>
        )}
      </div>
    </div>
  )
}
