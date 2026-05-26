'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User, Gift, TrendingUp, Trophy, LogOut } from 'lucide-react'
import { ROLES, type UserProfile } from '@/lib/db-constants'

export default function MyProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [dailyMsg, setDailyMsg] = useState('')
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    fetch(`/api/users/${user.username}`)
      .then(r => r.json())
      .then((data) => setProfile(data as UserProfile))
      .catch(() => setProfile(null))
  }, [user, router])

  if (!user) return null

  const claimBonus = async () => {
    setClaiming(true)
    try {
      const res = await fetch(`/api/users/${user.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_daily: true }),
      })
      const data = await res.json()
      if (!res.ok) { setDailyMsg(data.error); setClaiming(false); return }
      setDailyMsg('+250 V-Coins claimed! 🎉')
      await refreshUser()
      const updated = await fetch(`/api/users/${user.username}`).then(r => r.json())
      setProfile(updated as UserProfile)
    } catch (e) {
      setDailyMsg('Failed to claim bonus. Try again.')
    }
    setClaiming(false)
  }

  const setRole = async (role: string) => {
    try {
      await fetch(`/api/users/${user.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const updated = await fetch(`/api/users/${user.username}`).then(r => r.json())
      setProfile(updated as UserProfile)
      await refreshUser()
    } catch {}
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <User className="h-6 w-6 text-vault-gold" />
        <h1 className="text-2xl font-bold text-vault-cream">My Profile</h1>
      </div>

      {/* Coin balance */}
      <div className="vault-card rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">V-Coins Balance</p>
            <p className="text-3xl font-bold text-vault-gold">
              {(profile?.coins ?? user.coins).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            {profile?.joined_at && (
              <p className="text-xs text-muted-foreground">
                Joined {new Date(profile.joined_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={claimBonus}
          disabled={claiming}
          className="w-full bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold"
        >
          <Gift className="mr-2 h-4 w-4" />
          Claim Daily Bonus (+250 V-Coins)
        </Button>
        {dailyMsg && <p className="text-sm mt-2 text-center text-vault-gold">{dailyMsg}</p>}
      </div>

      {/* Stats */}
      {profile && (
        <div className="vault-card rounded-xl p-5 mb-4">
          <h2 className="font-bold text-vault-cream mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-vault-gold" /> Betting Stats
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Bets Placed', value: profile.bets_placed },
              { label: 'Correct', value: profile.bets_correct },
              { label: 'Total Won', value: `${(profile.total_won ?? 0).toLocaleString()} 🪙` },
              { label: 'Total Lost', value: `${(profile.total_lost ?? 0).toLocaleString()} 🪙` },
              { label: 'Biggest Win', value: `${(profile.biggest_win ?? 0).toLocaleString()} 🪙` },
              { label: 'Accuracy', value: profile.bets_placed ? `${((profile.bets_correct / profile.bets_placed) * 100).toFixed(1)}%` : 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold text-vault-cream">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role selection */}
      <div className="vault-card rounded-xl p-5 mb-4">
        <h2 className="font-bold text-vault-cream mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-vault-gold" /> Role
        </h2>
        <div className="flex gap-2 flex-wrap">
          {ROLES.map(r => (
            <Button
              key={r}
              size="sm"
              variant={profile?.role === r ? 'default' : 'outline'}
              onClick={() => setRole(r)}
              className={profile?.role === r
                ? 'bg-vault-gold text-vault-deep'
                : 'border-vault-bronze/50 text-vault-cream hover:border-vault-gold/40'}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
        onClick={() => { logout(); router.push('/') }}
      >
        <LogOut className="mr-2 h-4 w-4" /> Sign Out
      </Button>
    </div>
  )
}
