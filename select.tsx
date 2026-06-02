'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useClips, useBets, useVibeTags } from '@/hooks/use-data'
import { LayoutDashboard, Film, Trophy, Zap, Eye, EyeOff, Loader2, Plus, Check, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import type { CmdmiIdea, CmdmiGoal } from '@/lib/types'
import { CollabTools } from '@/components/common/collab-tools'

interface ClaimedProfile {
  id: string
  username: string
  vtuber_name: string
  display_name: string
  discoverable: boolean
  total_endorsements: number
}

export default function CreatorDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const { clips } = useClips()
  const { bets } = useBets()
  const { vibeTags } = useVibeTags()

  const [profile, setProfile] = useState<ClaimedProfile | null>(null)
  const [ideas, setIdeas] = useState<CmdmiIdea[]>([])
  const [goals, setGoals] = useState<CmdmiGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [notClaimed, setNotClaimed] = useState(false)
  const [togglingDiscover, setTogglingDiscover] = useState(false)
  const [goalAmounts, setGoalAmounts] = useState<Record<string, string>>({})
  const [settingGoal, setSettingGoal] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetch(`/api/vtubers/claim?username=${user.username}`)
      .then(r => r.json())
      .then(async data => {
        if (!data) { setNotClaimed(true); setLoading(false); return }
        setProfile(data)
        // Load CMDMI ideas
        const ideasRes = await fetch(`/api/cmdmi?profile_id=${data.vtuber_name}`)
        const ideasData = await ideasRes.json()
        setIdeas(ideasData)
        setLoading(false)
      })
  }, [user, router])

  const toggleDiscoverable = async () => {
    if (!profile) return
    setTogglingDiscover(true)
    await fetch('/api/vtubers/claim', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user?.username, discoverable: !profile.discoverable }),
    })
    setProfile(p => p ? { ...p, discoverable: !p.discoverable } : p)
    setTogglingDiscover(false)
  }

  const selectIdea = async (ideaId: string) => {
    const amount = parseInt(goalAmounts[ideaId] ?? '0')
    if (!amount || amount < 1) return
    setSettingGoal(ideaId)
    const res = await fetch('/api/cmdmi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: ideaId, action: 'select', username: user?.username, goal_amount: amount }),
    })
    if (res.ok) {
      setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, status: 'selected' } : i))
    }
    setSettingGoal(null)
  }

  const rejectIdea = async (ideaId: string) => {
    await fetch('/api/cmdmi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: ideaId, action: 'reject' }),
    })
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, status: 'rejected' } : i))
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="vault-card rounded-xl p-5 h-32 animate-pulse bg-muted/20" />)}
        </div>
      </div>
    )
  }

  if (notClaimed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="vault-card rounded-2xl p-8 text-center">
          <LayoutDashboard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-vault-cream mb-2">Creator Dashboard</h2>
          <p className="text-muted-foreground mb-6">
            You haven't claimed a VTuber profile yet. Find your profile on the Star Map and claim it to access your creator tools.
          </p>
          <Button asChild className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
            <Link href="/search">Find My Profile</Link>
          </Button>
        </div>
      </div>
    )
  }

  const myClips = clips.filter(c => c.vtuberId === profile?.vtuber_name)
  const myBets = bets.filter(b => b.vtuberId === profile?.vtuber_name)
  const pendingIdeas = ideas.filter(i => i.status === 'pending')
  const selectedIdeas = ideas.filter(i => i.status === 'selected')

  // Vibe tag breakdown
  const tagCounts: Record<string, number> = {}
  myClips.forEach(c => c.vibeTags.forEach(t => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 }))

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-vault-gold" />
          <div>
            <h1 className="text-2xl font-bold text-vault-cream">{profile?.display_name}</h1>
            <p className="text-xs text-muted-foreground">Creator Dashboard</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={toggleDiscoverable}
          disabled={togglingDiscover}
          className={`gap-2 ${profile?.discoverable ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' : 'border-muted-foreground/30 text-muted-foreground'}`}
        >
          {togglingDiscover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
           profile?.discoverable ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {profile?.discoverable ? 'Discoverable' : 'Hidden'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* CMDMI — pending ideas */}
          <section className="vault-card rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-vault-gold" />
                <h2 className="font-bold text-vault-cream">Chat Made Me Do It</h2>
              </div>
              <span className="text-xs text-muted-foreground">{pendingIdeas.length} pending</span>
            </div>

            {pendingIdeas.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No pending ideas yet. Fans can submit ideas on your profile page.</p>
            ) : (
              pendingIdeas.map(idea => (
                <div key={idea.id} className="px-5 py-4 border-b border-border last:border-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-vault-cream text-sm">{idea.title}</p>
                      {idea.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{idea.description}</p>}
                      <p className="text-xs text-vault-gold mt-1">↑ {idea.upvotes} from fans</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Goal (scraps)"
                      value={goalAmounts[idea.id] ?? ''}
                      onChange={e => setGoalAmounts(prev => ({ ...prev, [idea.id]: e.target.value }))}
                      className="h-8 text-xs bg-muted/30 border-border text-vault-cream w-36"
                    />
                    <Button size="sm" onClick={() => selectIdea(idea.id)}
                      disabled={settingGoal === idea.id || !goalAmounts[idea.id]}
                      className="h-8 bg-green-600 hover:bg-green-500 text-white text-xs gap-1">
                      {settingGoal === idea.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Select
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => rejectIdea(idea.id)}
                      className="h-8 text-muted-foreground hover:text-destructive text-xs gap-1">
                      <X className="h-3 w-3" /> Pass
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Active goals */}
          {selectedIdeas.length > 0 && (
            <section className="vault-card rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-400" />
                <h2 className="font-bold text-vault-cream">Active Goals</h2>
              </div>
              {selectedIdeas.map(idea => (
                <div key={idea.id} className="px-5 py-4 border-b border-border last:border-0">
                  <p className="font-medium text-vault-cream text-sm mb-2">{idea.title}</p>
                  <p className="text-xs text-vault-gold">Goal is active — fans are pledging scraps</p>
                </div>
              ))}
            </section>
          )}

          {/* Clips */}
          <section className="vault-card rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-vault-gold" />
                <h2 className="font-bold text-vault-cream">Clips About You</h2>
              </div>
              <span className="text-xs text-muted-foreground">{myClips.length} total</span>
            </div>
            {myClips.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No clips yet.</p>
            ) : (
              myClips.slice(0, 5).map(clip => (
                <div key={clip.id} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0">
                  <p className="text-sm text-vault-cream truncate flex-1 mr-3">{clip.title}</p>
                  <span className="text-xs text-vault-gold flex-shrink-0">↑{clip.votes.up}</span>
                </div>
              ))
            )}
            {myClips.length > 5 && (
              <Link href="/clips" className="flex items-center justify-center gap-1 px-5 py-3 text-xs text-vault-gold hover:bg-muted/10 transition-colors">
                View all {myClips.length} clips <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Stats */}
          <div className="vault-card rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stats</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Clips</span>
                <span className="font-medium text-vault-cream">{myClips.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bets</span>
                <span className="font-medium text-vault-cream">{myBets.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Endorsements</span>
                <span className="font-medium text-vault-cream">{profile?.total_endorsements ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CMDMI Ideas</span>
                <span className="font-medium text-vault-cream">{ideas.length}</span>
              </div>
            </div>
          </div>

          {/* Tag breakdown */}
          {Object.keys(tagCounts).length > 0 && (
            <div className="vault-card rounded-xl p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vibe Tags on Clips</h3>
              <div className="space-y-2">
                {Object.entries(tagCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([tagId, count]) => {
                    const tag = vibeTags.find(t => t.id === tagId)
                    const max = Math.max(...Object.values(tagCounts))
                    return (
                      <div key={tagId}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-vault-cream">{tag?.name ?? tagId}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <Progress value={(count / max) * 100} className="h-1" />
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="vault-card rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Profile</h3>
            <Link href={`/vtuber/${profile?.vtuber_name}`}
              className="flex items-center justify-between text-sm text-vault-cream hover:text-vault-gold transition-colors">
              View public profile <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Collab Tools — Streamer only */}
      {user?.role === 'Streamer' && profile && (
        <div className="vault-card rounded-2xl p-5 mt-6">
          <CollabTools myVtuberId={profile.vtuber_name} />
        </div>
      )}
      {user?.role !== 'Streamer' && (
        <div className="vault-card rounded-2xl p-5 mt-6 opacity-60">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🤝</span>
            <h2 className="font-bold text-muted-foreground">Collab Tools</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Collab tools are available to VTubers. Claim your profile and set your role to Streamer to access vibe-matching, blind collab, and schedule comparison.
          </p>
        </div>
      )}
    </div>
  )
}
