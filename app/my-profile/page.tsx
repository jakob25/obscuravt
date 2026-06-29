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
import type { NotificationType } from '@/lib/notifications'

interface ScrapTx {
  id: string
  amount: number
  balance_after: number
  kind: string
  note: string
  created_at: string
}

const NOTIF_LABELS: Record<NotificationType, string> = {
  cmdmi_selected: 'CMDI idea selected',
  cmdmi_funded: 'CMDI goal funded',
  cmdmi_new: 'New CMDI activity',
  bet_voting: 'Bet voting phase',
  bet_won: 'Bet wins',
  bet_lost: 'Bet losses',
  achievement: 'Achievements',
  qa_open: 'Q&A sessions',
  karaoke_open: 'Karaoke queue',
  schedule_vote: 'Schedule votes',
  meme_new: 'New memes',
}

export default function MyProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [dailyMsg, setDailyMsg] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [claimedProfiles, setClaimedProfiles] = useState<Array<{ id: string; name: string }>>([])
  const [ledger, setLedger] = useState<ScrapTx[]>([])
  const [ledgerNote, setLedgerNote] = useState('')
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean> | null>(null)

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
    fetch('/api/scraps/ledger', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.migrationRequired) setLedgerNote('Run migration 010 on Supabase to enable the ledger.')
        else setLedger(data?.transactions ?? [])
      })
      .catch(() => {})
    fetch('/api/notification-prefs', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setNotifPrefs(data?.prefs ?? null))
      .catch(() => {})
  }, [user, router])

  const toggleNotif = async (type: NotificationType, enabled: boolean) => {
    const res = await fetch('/api/notification-prefs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type, enabled }),
    })
    const data = await res.json()
    if (res.ok) setNotifPrefs(data.prefs)
  }

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

        <VaultPanel className="md:col-span-2 lg:col-span-4">
          <h2 className="font-bold text-vault-cream mb-3">Vault Scraps ledger</h2>
          {ledgerNote ? (
            <p className="text-sm text-muted-foreground">{ledgerNote}</p>
          ) : ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet. Claim daily bonus or place a bet to start.</p>
          ) : (
            <ul className="divide-y divide-border text-sm max-h-64 overflow-y-auto">
              {ledger.map(tx => (
                <li key={tx.id} className="py-2 flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-vault-cream capitalize">{tx.kind.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground truncate">{tx.note || new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`tabular-nums font-medium shrink-0 ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </VaultPanel>

        {notifPrefs && (
          <VaultPanel className="md:col-span-2 lg:col-span-4">
            <h2 className="font-bold text-vault-cream mb-3">Notification preferences</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {(Object.keys(NOTIF_LABELS) as NotificationType[]).map(type => (
                <label key={type} className="flex items-center justify-between gap-2 text-sm py-1.5">
                  <span className="text-muted-foreground">{NOTIF_LABELS[type]}</span>
                  <input
                    type="checkbox"
                    checked={notifPrefs[type] !== false}
                    onChange={e => toggleNotif(type, e.target.checked)}
                    className="accent-vault-gold"
                  />
                </label>
              ))}
            </div>
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