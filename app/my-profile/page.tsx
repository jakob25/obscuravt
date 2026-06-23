'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Gift, LogOut } from 'lucide-react'
import { ROLES } from '@/lib/roles'
import type { UserProfile } from '@/lib/profile-types'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { ProfileSwitcher } from '@/components/profile/profile-switcher'
import { StatCard, VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'
import Link from 'next/link'

export default function MyProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [dailyMsg, setDailyMsg] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [claimedProfiles, setClaimedProfiles] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetch(`/api/users/${user.username}`, { credentials: 'include' })
      .then(r => r.json())
      .then((data) => setProfile(data as UserProfile))
      .catch(() => setProfile(null))
    fetch('/api/profiles/claimed', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setClaimedProfiles(data?.profiles ?? []))
      .catch(() => setClaimedProfiles([]))
  }, [user, router])

  if (!user) return null

  const claimBonus = async () => {
    setClaiming(true)
    try {
      const res = await fetch(`/api/users/${user.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ claim_daily: true }),
      })
      const data = await res.json()
      if (!res.ok) { setDailyMsg(data.error); setClaiming(false); return }
      setDailyMsg('+250 scraps. Come back tomorrow.')
      await refreshUser()
      const updated = await fetch(`/api/users/${user.username}`, { credentials: 'include' }).then(r => r.json())
      setProfile(updated as UserProfile)
    } catch {
      setDailyMsg('Claim failed. Try again.')
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
      const updated = await fetch(`/api/users/${user.username}`, { credentials: 'include' }).then(r => r.json())
      setProfile(updated as UserProfile)
      await refreshUser()
    } catch { /* ignore */ }
  }

  const scraps = profile?.coins ?? user.coins

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream">Your dossier</GlitchHeading>
        <ProfileSwitcher />
      </div>
      <p className="text-sm text-muted-foreground mb-6">@{user.username} · scraps, stats, claimed profiles</p>
      <VaultDivider className="mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Vault scraps"
          value={scraps.toLocaleString()}
          featured
          className="lg:col-span-2"
        />

        <VaultPanel className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">Daily pickup</p>
              <p className="text-sm text-vault-cream mt-1">+250 scraps, once per day</p>
            </div>
            {profile?.joined_at && (
              <p className="text-xs text-muted-foreground">
                Since {new Date(profile.joined_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button
            onClick={claimBonus}
            disabled={claiming}
            variant="vault"
            className="w-full font-semibold"
          >
            <Gift className="mr-2 h-4 w-4" />
            Claim daily bonus
          </Button>
          {dailyMsg && <p className="text-sm mt-2 text-center text-vault-gold">{dailyMsg}</p>}
        </VaultPanel>

        {profile && (
          <div className="md:col-span-2 lg:col-span-4">
            <h2 className="font-bold text-vault-cream mb-4">Betting record</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard
                label="Biggest win"
                value={`${(profile.biggest_win ?? 0).toLocaleString()}`}
                featured
                className="md:col-span-2"
              />
              <StatCard label="Bets placed" value={profile.bets_placed} />
              <StatCard label="Correct" value={profile.bets_correct} />
              <StatCard label="Total won" value={`${(profile.total_won ?? 0).toLocaleString()}`} />
              <StatCard label="Total lost" value={`${(profile.total_lost ?? 0).toLocaleString()}`} />
              <StatCard
                label="Accuracy"
                value={profile.bets_placed ? `${((profile.bets_correct / profile.bets_placed) * 100).toFixed(1)}%` : '—'}
              />
            </div>
          </div>
        )}

        {claimedProfiles.length > 0 && (
          <VaultPanel className="md:col-span-2">
            <h2 className="font-bold text-vault-cream mb-3">Claimed profiles</h2>
            <div className="space-y-2">
              {claimedProfiles.map(p => (
                <Link key={p.id} href={`/vtuber/${p.id}`} className="block text-sm text-vault-cream hover:text-vault-gold transition-colors">
                  {p.name} →
                </Link>
              ))}
            </div>
            <Link href="/creator" className="text-xs text-vault-gold hover:underline mt-3 inline-block">Creator dashboard →</Link>
          </VaultPanel>
        )}

        <VaultPanel>
          <h2 className="font-bold text-vault-cream mb-3">Role</h2>
          <div className="flex gap-2 flex-wrap">
            {ROLES.map(r => (
              <Button
                key={r}
                size="sm"
                variant={profile?.role === r ? 'vault' : 'outline'}
                onClick={() => setRole(r)}
                className={profile?.role === r
                  ? ''
                  : 'border-vault-bronze/50 text-vault-cream hover:border-vault-gold/40'}
              >
                {r}
              </Button>
            ))}
          </div>
        </VaultPanel>

        <VaultPanel className="flex items-end">
          <Button
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={() => { logout(); router.push('/') }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </VaultPanel>
      </div>
    </div>
  )
}