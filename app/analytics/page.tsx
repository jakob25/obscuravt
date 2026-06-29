'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { normalizeRole } from '@/lib/roles'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'
import { VaultFrame } from '@/components/vault/vault-frame'
import { BarChart3, Users, Lightbulb, Image, Music, MessageSquare, Calendar, Film, Target } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ClaimedProfile {
  id: string
  name: string
}

interface AnalyticsData {
  circleFollowers: number
  fanEngagementScore: number
  chatMadeMeDoIt: { ideas: number; activeGoals: number; fundedGoals: number }
  memes: { total: number; last7d: number; last30d: number }
  fanArt: { total: number }
  karaoke: { pending: number; queued: number; done: number }
  qa: { openSessions: number; questions: number }
  scheduleVotes: number
  predictionsOpen: number
  clips: number
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users
  label: string
  value: number | string
  sub?: string
}) {
  return (
    <VaultPanel className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-vault-gold" />
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-vault-cream tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </VaultPanel>
  )
}

function AnalyticsContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profiles, setProfiles] = useState<ClaimedProfile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [fetching, setFetching] = useState(false)

  const role = normalizeRole(user?.role ?? null)
  const allowed = role === 'VTuber' || role === 'Creator'

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    if (!allowed) { router.push('/'); return }

    fetch('/api/profiles/claimed', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list = d?.profiles ?? []
        setProfiles(list)
        const fromUrl = searchParams.get('profile')
        const id = fromUrl && list.some((p: ClaimedProfile) => p.id === fromUrl)
          ? fromUrl
          : d?.activeId ?? list[0]?.id ?? null
        setActiveId(id)
      })
      .catch(() => {})
  }, [user, loading, allowed, router, searchParams])

  useEffect(() => {
    if (!activeId) return
    setFetching(true)
    fetch(`/api/analytics?profileId=${encodeURIComponent(activeId)}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setFetching(false) })
      .catch(() => setFetching(false))
  }, [activeId])

  if (loading || !user || !allowed) return null

  const active = profiles.find(p => p.id === activeId)
  const engagementPct = data
    ? Math.min(Math.round((data.fanEngagementScore / Math.max(data.fanEngagementScore, 50)) * 100), 100)
    : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageBackNav fallbackHref="/creator" />
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="h-6 w-6 text-vault-gold" />
        <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream">
          VTuber Analytics
        </GlitchHeading>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Fans shaping your stream — engagement at a glance.
      </p>
      <VaultDivider className="mb-6" />

      {profiles.length > 0 ? (
        <VaultFrame className="p-4 mb-6">
          <label className="text-xs text-muted-foreground block mb-1">Profile</label>
          <select
            value={activeId ?? ''}
            onChange={e => setActiveId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm"
          >
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {active && (
            <Link href={`/vtuber/${active.id}`} className="text-xs text-vault-gold hover:underline mt-2 inline-block">
              View public dossier →
            </Link>
          )}
        </VaultFrame>
      ) : (
        <VaultPanel className="p-6 text-sm text-muted-foreground text-center mb-6">
          Claim a profile first to see analytics.
        </VaultPanel>
      )}

      {fetching && <p className="text-sm text-muted-foreground animate-pulse text-center py-8">Crunching numbers…</p>}

      {!fetching && data && data.circleFollowers === 0 && data.fanEngagementScore === 0 && (
        <VaultPanel className="p-6 text-center mb-6">
          <p className="text-sm text-muted-foreground mb-3">
            Quiet archive so far. Encourage fans to add you to Their Circle, submit clips, and engage on your dossier.
          </p>
          {active && (
            <Link href={`/vtuber/${active.id}`} className="text-sm text-vault-gold hover:underline">
              Open public dossier →
            </Link>
          )}
        </VaultPanel>
      )}

      {!fetching && data && (
        <>
          <VaultPanel className="p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-vault-cream">Activity score</span>
              <span className="text-xs text-vault-gold">{data.fanEngagementScore} pts</span>
            </div>
            <Progress value={engagementPct} className="h-2" />
            <p className="text-[11px] text-muted-foreground mt-2">
              Circle size, submissions, karaoke, Q&A, votes, and Chat Made Me Do It activity combined.
            </p>
          </VaultPanel>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard icon={Users} label="Circle followers" value={data.circleFollowers} sub="Fans who added you" />
            <StatCard icon={Lightbulb} label="Stream ideas" value={data.chatMadeMeDoIt.ideas} sub={`${data.chatMadeMeDoIt.activeGoals} active · ${data.chatMadeMeDoIt.fundedGoals} funded`} />
            <StatCard icon={Image} label="Memes" value={data.memes.total} sub={`${data.memes.last7d} this week · ${data.memes.last30d} this month`} />
            <StatCard icon={Image} label="Fan art" value={data.fanArt.total} />
            <StatCard icon={Music} label="Karaoke" value={data.karaoke.pending + data.karaoke.queued} sub={`${data.karaoke.done} performed`} />
            <StatCard icon={MessageSquare} label="Q&A" value={data.qa.questions} sub={`${data.qa.openSessions} session${data.qa.openSessions === 1 ? '' : 's'} open`} />
            <StatCard icon={Calendar} label="Schedule votes" value={data.scheduleVotes} />
            <StatCard icon={Target} label="Predictions" value={data.predictionsOpen} sub="Open bets" />
            <StatCard icon={Film} label="Clips" value={data.clips} />
          </div>
        </>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-sm text-muted-foreground animate-pulse">Loading…</div>}>
      <AnalyticsContent />
    </Suspense>
  )
}
