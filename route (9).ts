'use client'

import { use, useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { useVTubers } from '@/hooks/use-data'
import { Trophy, Target, TrendingUp, Star, Calendar } from 'lucide-react'
import Link from 'next/link'

interface PublicProfile {
  username: string
  coins: number
  role: string | null
  bio: string
  joined_at: string
  total_won: number
  total_lost: number
  bets_placed: number
  bets_correct: number
  biggest_win: number
  favorite_vtubers: string
}

interface Badge {
  achievement_id: string
  earned_at: string
}

interface Achievement {
  id: string
  name: string
  icon: string
  description: string
}

interface Props { params: Promise<{ username: string }> }

export default function UserProfilePage({ params }: Props) {
  const { username } = use(params)
  const { vtubers } = useVTubers()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound404, setNotFound404] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${username}`),
      fetch(`/api/achievements?username=${username}`),
    ]).then(async ([profileRes, achieveRes]) => {
      if (!profileRes.ok) { setNotFound404(true); setLoading(false); return }
      const profileData = await profileRes.json()
      const achieveData = await achieveRes.json()
      setProfile(profileData)
      setBadges(achieveData.badges ?? [])
      setAchievements(achieveData.achievements ?? [])
      setLoading(false)
    })
  }, [username])

  if (notFound404) return notFound()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="vault-card rounded-2xl p-6 mb-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-muted/40" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted/40 rounded" />
              <div className="h-3 w-20 bg-muted/30 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const accuracy = profile.bets_placed > 0
    ? ((profile.bets_correct / profile.bets_placed) * 100).toFixed(1)
    : null

  const earnedIds = new Set(badges.map(b => b.achievement_id))
  const earnedBadges = achievements.filter(a => earnedIds.has(a.id))

  const favoriteVtuberIds = profile.favorite_vtubers
    ? profile.favorite_vtubers.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const favoriteVtubers = favoriteVtuberIds
    .map(id => vtubers.find(v => v.id === id || v.name.toLowerCase() === id.toLowerCase()))
    .filter(Boolean)

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="vault-card rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-vault-gold to-vault-amber flex items-center justify-center text-vault-deep text-xl font-bold flex-shrink-0">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-vault-cream">{profile.username}</h1>
              {profile.role && (
                <span className="px-2 py-0.5 rounded-full bg-vault-gold/15 border border-vault-gold/30 text-vault-gold text-xs font-medium">
                  {profile.role}
                </span>
              )}
            </div>
            {profile.joined_at && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {new Date(profile.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-vault-gold tabular-nums">{profile.coins.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">V-Coins</p>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
        )}
      </div>

      {/* Stats */}
      <div className="vault-card rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-vault-cream mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-vault-gold" /> Betting Record
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {([
            { label: 'Bets Placed', value: profile.bets_placed.toLocaleString(), icon: Trophy },
            { label: 'Correct', value: profile.bets_correct.toLocaleString(), icon: Target },
            { label: 'Total Won', value: `${profile.total_won.toLocaleString()} 🪙`, icon: Star },
            { label: 'Biggest Win', value: `${profile.biggest_win.toLocaleString()} 🪙`, icon: Star },
          ] as { label: string; value: string; icon: React.ElementType }[]).map(({ label, value }) => (
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

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div className="vault-card rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-vault-cream mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-vault-gold" /> Achievements ({earnedBadges.length})
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {earnedBadges.map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-muted/20 rounded-xl p-3 border border-vault-gold/20">
                <span className="text-2xl flex-shrink-0">{a.icon ?? '🏆'}</span>
                <div className="min-w-0">
                  <p className="font-medium text-vault-cream text-sm truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorite VTubers */}
      {favoriteVtubers.length > 0 && (
        <div className="vault-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-vault-cream mb-4">Favorite VTubers</h2>
          <div className="flex flex-wrap gap-3">
            {favoriteVtubers.map(v => v && (
              <Link
                key={v.id}
                href={`/vtuber/${v.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border hover:border-vault-gold/30 transition-colors"
              >
                <img src={v.avatarUrl} alt={v.name} className="h-6 w-6 rounded-full border border-vault-bronze/40" />
                <span className="text-sm text-vault-cream">{v.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
