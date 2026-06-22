'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { Shield, Check, X, ExternalLink } from 'lucide-react'

const ADMINS = ['jakob25', 'admin']

interface PendingVtuber {
  id: string
  name: string
  handle: string
  platform: string
  link: string
  bio: string
  nominated_by: string
  avatar_url: string | null
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [pending, setPending] = useState<PendingVtuber[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/pending', { credentials: 'include' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setPending(data.pending ?? [])
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    if (!ADMINS.includes(user.username)) { router.push('/'); return }
    load()
  }, [user, loading, router, load])

  const moderate = async (vtuberId: string, approved: boolean) => {
    setBusy(vtuberId)
    setError('')
    const res = await fetch('/api/admin/pending', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ vtuberId, approved }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error)
    else setPending(prev => prev.filter(p => p.id !== vtuberId))
    setBusy(null)
  }

  if (loading || !user || !ADMINS.includes(user.username)) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-vault-gold" />
        <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream">Admin Panel</GlitchHeading>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <VaultFrame className="p-5">
        <h2 className="text-sm font-semibold text-vault-cream mb-4">
          Pending VTuber Nominations ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending nominations — vault is clear.</p>
        ) : (
          <div className="space-y-4">
            {pending.map(v => (
              <div key={v.id} className="p-4 rounded-lg border border-border/60 bg-muted/20">
                <div className="flex items-start gap-3">
                  {v.avatar_url ? (
                    <img src={v.avatar_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-vault-gold/20 flex items-center justify-center text-vault-gold font-bold">
                      {v.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-vault-cream">{v.name}</h3>
                    {v.handle && <p className="text-xs text-muted-foreground">{v.handle}</p>}
                    {v.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.bio}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">Nominated by @{v.nominated_by}</p>
                    {v.link && (
                      <a href={v.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-vault-gold flex items-center gap-1 mt-1">
                        <ExternalLink className="h-3 w-3" />{v.platform || 'Link'}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    disabled={busy === v.id}
                    onClick={() => moderate(v.id, true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 text-sm font-medium hover:bg-green-600/30 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy === v.id}
                    onClick={() => moderate(v.id, false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-sm font-medium hover:bg-red-600/30 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </VaultFrame>
    </div>
  )
}