'use client'

import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'

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
    const url = user ? `/api/achievements?username=${user.username}` : '/api/achievements'
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
      .catch(() => {})
  }, [user])

  const earnedIds = new Set(badges.map(b => b.achievement_id))

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <GlitchHeading as="h1" variant="archive" className="text-2xl font-bold text-vault-cream mb-1">Achievements</GlitchHeading>
      <p className="text-sm text-muted-foreground mb-2">Bragging rights with scrap bonuses attached.</p>
      {user && (
        <p className="text-sm text-muted-foreground mb-4">{badges.length}/{achievements.length} earned</p>
      )}
      <VaultDivider className="mb-6" />
      <div className="grid sm:grid-cols-2 gap-4">
        {achievements.map(a => {
          const earned = earnedIds.has(a.id)
          const badge = badges.find(b => b.achievement_id === a.id)
          return (
            <VaultPanel key={a.id} className={`p-4 transition-all ${earned ? 'border-vault-gold/40' : 'opacity-60'}`}>
              <div className="flex items-start gap-3">
                {a.icon && a.icon.length <= 2 && !/[\u{1F300}-\u{1FAFF}]/u.test(a.icon) ? (
                  <span className="text-2xl font-mono text-vault-gold shrink-0">{a.icon}</span>
                ) : (
                  <Trophy className="h-8 w-8 text-vault-gold shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-vault-cream">{a.name}</h3>
                    {earned && <span className="text-xs text-vault-gold font-archive tracking-wide">✓ Earned</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{a.description}</p>
                  {a.reward_coins > 0 && (
                    <p className="text-xs text-vault-amber">+{a.reward_coins.toLocaleString()} scraps reward</p>
                  )}
                  {badge && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </VaultPanel>
          )
        })}
      </div>
    </div>
  )
}
