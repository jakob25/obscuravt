'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { Shield, Check, X, ExternalLink, ScrollText } from 'lucide-react'

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

interface AuditEntry {
  id: string
  actor: string
  action: string
  target_type: string
  target_id: string | null
  created_at: string
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'pending' | 'audit'>('pending')
  const [pending, setPending] = useState<PendingVtuber[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [auditNote, setAuditNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadPending = useCallback(async () => {
    const res = await fetch('/api/admin/pending', { credentials: 'include' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setPending(data.pending ?? [])
  }, [])

  const loadAudit = useCallback(async () => {
    const res = await fetch('/api/admin/audit', { credentials: 'include' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    if (data.migrationRequired) setAuditNote('Run migration 009 on Supabase for audit log.')
    setAudit(data.entries ?? [])
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    if (!ADMINS.includes(user.username)) { router.push('/'); return }
    loadPending()
    loadAudit()
  }, [user, loading, router, loadPending, loadAudit])

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
    else {
      setPending(prev => prev.filter(p => p.id !== vtuberId))
      loadAudit()
    }
    setBusy(null)
  }

  if (loading || !user || !ADMINS.includes(user.username)) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <p className="text-xs font-stamp tracking-widest text-red-400/90 uppercase mb-2">Classified — Vault Operations</p>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-vault-gold" />
        <GlitchHeading as="h1" variant="case" className="text-2xl font-bold text-vault-cream">Admin Panel</GlitchHeading>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'pending' ? 'bg-vault-gold/20 text-vault-gold border border-vault-gold/30' : 'text-muted-foreground border border-border'}`}
        >
          Nominations ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('audit')}
          className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${tab === 'audit' ? 'bg-vault-gold/20 text-vault-gold border border-vault-gold/30' : 'text-muted-foreground border border-border'}`}
        >
          <ScrollText className="h-3.5 w-3.5" /> Audit log
        </button>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {tab === 'pending' && (
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
      )}

      {tab === 'audit' && (
        <VaultFrame className="p-5">
          <h2 className="text-sm font-semibold text-vault-cream mb-4">Admin audit log</h2>
          {auditNote && <p className="text-sm text-muted-foreground mb-4">{auditNote}</p>}
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries yet.</p>
          ) : (
            <ul className="space-y-2 text-sm max-h-96 overflow-y-auto">
              {audit.map(entry => (
                <li key={entry.id} className="py-2 border-b border-border/50 last:border-0">
                  <p className="text-vault-cream">
                    <span className="text-vault-gold">@{entry.actor}</span>
                    {' '}{entry.action.replace(/_/g, ' ')}
                    {' '}<span className="text-muted-foreground">({entry.target_type}{entry.target_id ? ` · ${entry.target_id}` : ''})</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </VaultFrame>
      )}
    </div>
  )
}