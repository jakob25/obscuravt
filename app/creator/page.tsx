'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { normalizeRole } from '@/lib/roles'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { VaultFrame } from '@/components/vault/vault-frame'
import {
  Calendar, Palette, Lightbulb, Users, BookOpen, BarChart3,
} from 'lucide-react'
import { VaultDivider } from '@/components/vault/vault-surfaces'
import { CollabRequestForm } from '@/components/collab/collab-request-form'
import { CollabNotifications } from '@/components/collab/collab-notifications'

interface ClaimedProfile {
  id: string
  name: string
  avatar_url: string | null
}

const TOOLS: Array<{
  label: string
  icon: typeof Calendar
  desc: string
  needsProfile: boolean
  path: (id: string) => string
}> = [
  { label: 'Stream Schedule', icon: Calendar, desc: 'Set weekly stream slots', needsProfile: true, path: id => `/schedule?vtuber=${id}` },
  { label: 'Chat Made Me Do It', icon: Lightbulb, desc: 'Fans pitch stream ideas — pledge scraps to make them happen', needsProfile: true, path: id => `/cmdmi?profile=${id}` },
  { label: 'Fan Art', icon: Palette, desc: 'Gallery submissions', needsProfile: true, path: id => `/fan-art?vtuber=${id}` },
  { label: 'Collab Finder', icon: Users, desc: 'Vibe match & schedule overlap', needsProfile: false, path: () => '/collab' },
  { label: 'Stream Resources', icon: BookOpen, desc: 'Chat games & tools', needsProfile: false, path: () => '/resources' },
  { label: 'Analytics', icon: BarChart3, desc: 'Circle size and fan submissions', needsProfile: true, path: id => `/analytics?profile=${id}` },
]

export default function CreatorDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<ClaimedProfile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [claimRows, setClaimRows] = useState<Array<{ vtuberId: string; name: string; status: string; claimedAt?: string; reason?: string }>>([])

  const role = normalizeRole(user?.role ?? null)
  const allowed = role === 'VTuber' || role === 'Creator'

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    if (!allowed) { router.push('/'); return }

    Promise.all([
      fetch('/api/profiles/claimed', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch('/api/claim-status', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
    ]).then(([claimedData, statusData]) => {
      setProfiles(claimedData?.profiles ?? [])
      setActiveId(claimedData?.activeId ?? claimedData?.profiles?.[0]?.id ?? null)
      setClaimRows(statusData?.profiles ?? [])
    }).catch(() => {})
  }, [user, loading, allowed, router])

  if (loading || !user || !allowed) return null

  const active = profiles.find(p => p.id === activeId)

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <PageBackNav fallbackHref="/" />
      <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-1">Creator Dashboard</GlitchHeading>
      <p className="text-sm text-muted-foreground mb-4">
        {role === 'VTuber' ? 'Manage claimed profiles and fan tools.' : 'Clip, curate, and nominate creators.'}
      </p>
      <VaultDivider className="mb-6" />

      <VaultFrame className="p-5 mb-6">
        <p className="text-sm text-muted-foreground mb-3">
          Switch profiles, jump to tools, keep the Archive fed.
        </p>
        {profiles.length > 0 ? (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Active profile:</span>
            <select
              value={activeId ?? ''}
              onChange={async e => {
                const id = e.target.value
                setActiveId(id)
                await fetch('/api/profiles/claimed', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ activeVtuberId: id }),
                })
              }}
              className="h-9 px-3 rounded-lg bg-muted/30 border border-border text-sm text-vault-cream"
            >
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {active && (
              <Link href={`/vtuber/${active.id}`} className="text-xs text-vault-gold hover:underline">
                View public profile →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-vault-cream">
              No claimed profiles yet.{' '}
              <Link href="/discover" className="text-vault-gold hover:underline">Discover VTubers</Link>
              {' '}and claim yours from their dossier, or{' '}
              <Link href="/nominator" className="text-vault-gold hover:underline">nominate yourself</Link>.
            </p>
            {claimRows.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1">
                {claimRows.map(row => (
                  <li key={row.vtuberId}>
                    <Link href={`/vtuber/${row.vtuberId}`} className="text-vault-cream hover:text-vault-gold">{row.name}</Link>
                    {' '}— claimed {new Date(row.claimedAt as string).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </VaultFrame>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {TOOLS.map(tool => {
          const href = tool.needsProfile && activeId ? tool.path(activeId) : tool.path(activeId ?? '')
          const disabled = tool.needsProfile && !activeId
          const Icon = tool.icon
          if (disabled) {
            return (
              <VaultFrame key={tool.label} className="p-4 h-full opacity-50">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-vault-gold shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-vault-cream">{tool.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Claim a profile first</p>
                  </div>
                </div>
              </VaultFrame>
            )
          }
          return (
            <Link key={tool.label} href={href} className="block group">
              <VaultFrame className="p-4 h-full hover:border-vault-gold/30 transition-colors">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-vault-gold shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-vault-cream group-hover:text-vault-gold transition-colors">{tool.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
                  </div>
                </div>
              </VaultFrame>
            </Link>
          )
        })}
      </div>

      {activeId && (
        <div className="space-y-6">
          <VaultFrame className="p-5">
            <h2 className="text-sm font-semibold text-vault-cream mb-3">
              Quick engagement
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Memes, Q&A, karaoke requests, predictions — all on your public dossier.
            </p>
            <Link href={`/vtuber/${encodeURIComponent(activeId)}`} className="text-sm text-vault-gold hover:underline">
              Open {active?.name ?? 'profile'} engagement hub →
            </Link>
          </VaultFrame>

          <CollabRequestForm />
          <CollabNotifications />
        </div>
      )}
    </div>
  )
}