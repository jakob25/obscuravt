'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Gift, TrendingUp, Trophy, LogOut, Target, Star, Coins, Check, Clock, Bell, ShoppingBag } from 'lucide-react'
import { ROLES } from '@/lib/db-constants'
import Link from 'next/link'

type Profile = Record<string, unknown>

export default function MyProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dailyMsg, setDailyMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [canClaim, setCanClaim] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetch(`/api/users/${user.username}`).then(r => r.json()).then((data: Profile) => {
      setProfile(data)
      // Check if daily bonus is claimable
      if (!data.last_bonus) {
        setCanClaim(true)
      } else {
        const last = new Date(data.last_bonus as string)
        const diffHours = (Date.now() - last.getTime()) / 3_600_000
        setCanClaim(diffHours >= 20)
      }
    })
  }, [user, router])

  if (!user) return null

  const claimBonus = async () => {
    setClaiming(true)
    const res = await fetch(`/api/users/${user.username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim_daily: true }),
    })
    const data = await res.json()
    if (!res.ok) {
      setDailyMsg({ text: data.error, ok: false })
      setClaiming(false)
      return
    }
    setDailyMsg({ text: '+250 Vault Scraps claimed!', ok: true })
    setCanClaim(false)
    await refreshUser()
    const updated = await fetch(`/api/users/${user.username}`).then(r => r.json())
    setProfile(updated)
    setClaiming(false)
  }

  const setRole = async (role: string) => {
    await fetch(`/api/users/${user.username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const updated = await fetch(`/api/users/${user.username}`).then(r => r.json())
    setProfile(updated)
    await refreshUser()
  }

  const coins = (profile?.coins as number | undefined) ?? user.coins
  const betsPlaced = (profile?.bets_placed as number) ?? 0
  const betsCorrect = (profile?.bets_correct as number) ?? 0
  const totalWon = (profile?.total_won as number) ?? 0
  const totalLost = (profile?.total_lost as number) ?? 0
  const accuracy = betsPlaced > 0 ? ((betsCorrect / betsPlaced) * 100).toFixed(1) : null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Profile header */}
        <div className="vault-card rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-vault-gold to-vault-amber flex items-center justify-center text-vault-deep text-xl font-bold flex-shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-vault-cream">{user.username}</h1>
              {!!profile?.joined_at && (
                <p className="text-xs text-muted-foreground">
                  Vault member since {new Date(profile.joined_at as string).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          {/* Coin balance — big and prominent */}
          <div className="bg-gradient-to-r from-vault-gold/15 to-vault-amber/10 border border-vault-gold/25 rounded-xl p-5 mb-4 text-center">
            <p className="text-xs text-vault-gold/70 uppercase tracking-widest mb-1 font-medium">Vault Scraps Balance</p>
            <p className="text-4xl font-bold text-vault-gold tabular-nums">{coins.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Spend on bets · Earn by winning</p>
          </div>

          {/* Daily bonus — primary CTA */}
          <button
            onClick={canClaim ? claimBonus : undefined}
            disabled={claiming || !canClaim}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              canClaim
                ? 'bg-vault-gold hover:bg-vault-amber text-vault-deep shadow-lg shadow-vault-gold/20 hover:shadow-vault-gold/30 active:scale-[0.98]'
                : 'bg-muted/30 text-muted-foreground cursor-not-allowed border border-border'
            }`}
          >
            {claiming ? (
              <>Loading…</>
            ) : canClaim ? (
              <><Gift className="h-4 w-4" /> Claim Daily Bonus — +250 Vault Scraps</>
            ) : (
              <><Clock className="h-4 w-4" /> Daily Bonus Already Claimed</>
            )}
          </button>

          {dailyMsg && (
            <div className={`mt-3 p-2.5 rounded-lg text-xs text-center font-medium ${
              dailyMsg.ok
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-destructive/10 border border-destructive/20 text-destructive'
            }`}>
              {dailyMsg.ok && <Check className="inline h-3.5 w-3.5 mr-1" />}
              {dailyMsg.text}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="vault-card rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-vault-cream mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-vault-gold" /> Betting Stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: 'Bets Placed', value: betsPlaced.toLocaleString(), icon: Trophy },
              { label: 'Bets Correct', value: betsCorrect.toLocaleString(), icon: Target },
              { label: 'Total Won', value: `${totalWon.toLocaleString()} 🪙`, icon: Star },
              { label: 'Total Lost', value: `${totalLost.toLocaleString()} 🪙`, icon: Star },
            ] as { label: string; value: string; icon: React.ElementType }[]).map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-muted/20 rounded-xl p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="font-bold text-vault-cream">{value}</p>
              </div>
            ))}
          </div>
          {accuracy !== null && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Accuracy</span>
              <span className={`font-bold text-sm ${parseFloat(accuracy) >= 50 ? 'text-green-400' : 'text-muted-foreground'}`}>
                {accuracy}%
              </span>
            </div>
          )}
        </div>

        {/* Role */}
        <div className="vault-card rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-vault-cream mb-3">Role</h2>
          <div className="flex gap-2 flex-wrap">
            {ROLES.map(r => (
              <Button
                key={r}
                size="sm"
                onClick={() => setRole(r)}
                variant={profile?.role === r ? 'default' : 'outline'}
                className={profile?.role === r
                  ? 'bg-vault-gold text-vault-deep font-semibold'
                  : 'border-border text-muted-foreground hover:text-vault-cream hover:border-vault-bronze/50'}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link href="/achievements" className="vault-card rounded-xl p-4 hover:border-vault-gold/30 transition-colors text-center">
            <div className="text-2xl mb-1">🏆</div>
            <p className="text-sm font-medium text-vault-cream">Achievements</p>
          </Link>
          <Link href="/leaderboard" className="vault-card rounded-xl p-4 hover:border-vault-gold/30 transition-colors text-center">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-sm font-medium text-vault-cream">Leaderboard</p>
          </Link>
          <Link href="/notifications" className="vault-card rounded-xl p-4 hover:border-vault-gold/30 transition-colors text-center">
            <div className="text-2xl mb-1">🔔</div>
            <p className="text-sm font-medium text-vault-cream">Notifications</p>
          </Link>
          <Link href="/shop" className="vault-card rounded-xl p-4 hover:border-vault-gold/30 transition-colors text-center">
            <div className="text-2xl mb-1">🛍️</div>
            <p className="text-sm font-medium text-vault-cream">Shop</p>
          </Link>
        </div>

        {/* Sign out */}
        <Button
          variant="outline"
          className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
          onClick={() => { logout(); router.push('/') }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  )
}
