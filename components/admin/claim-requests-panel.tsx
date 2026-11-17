'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, X, ExternalLink } from 'lucide-react'
import { VaultFrame } from '@/components/vault/vault-frame'

interface ClaimRequestRow {
  id: string
  vtuber_id: string
  requested_by: string
  proof_link: string | null
  message: string | null
  status: string
  created_at: string | null
  vtubers?: { name?: string; link?: string | null; claimed_by?: string | null } | { name?: string; link?: string | null; claimed_by?: string | null }[] | null
}

/** Admin review of site claim requests. Approving here is the only way a request grants a file. */
export function ClaimRequestsPanel() {
  const [rows, setRows] = useState<ClaimRequestRow[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/claim-requests', { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.error || 'Could not load claim requests.'); return }
    setRows(data.requests ?? [])
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin fetch
    void load()
  }, [load])

  const decide = async (id: string, decision: 'approve' | 'reject') => {
    setBusy(id); setError('')
    const res = await fetch('/api/admin/claim-requests', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, decision }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) setError(data.error || 'Could not save that decision.')
    setBusy(null)
    void load()
  }

  const pending = rows.filter(r => r.status === 'pending')

  return (
    <VaultFrame className="p-5 mb-6">
      <h2 className="text-sm font-semibold text-vault-cream mb-1">Claim requests ({pending.length} pending)</h2>
      <p className="text-xs text-muted-foreground mb-4">Check that the creator&apos;s channel and socials link to each other before approving.</p>
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending claim requests.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map(r => {
            const v = Array.isArray(r.vtubers) ? r.vtubers[0] : r.vtubers
            return (
              <li key={r.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-vault-cream">
                    <span className="font-semibold">@{r.requested_by}</span> wants{' '}
                    <Link href={`/vtuber/${r.vtuber_id}`} className="text-vault-gold hover:underline">{v?.name || r.vtuber_id}</Link>
                  </span>
                  <span className="flex gap-2">
                    <button type="button" disabled={busy === r.id} onClick={() => decide(r.id, 'approve')} className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400 disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button type="button" disabled={busy === r.id} onClick={() => decide(r.id, 'reject')} className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-1 text-xs text-red-400 disabled:opacity-50">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                  {v?.link && (
                    <p>Channel on file: <a href={v.link} target="_blank" rel="noopener noreferrer" className="underline">{v.link}</a></p>
                  )}
                  {r.proof_link && (
                    <p className="flex items-center gap-1">Proof: <a href={r.proof_link} target="_blank" rel="noopener noreferrer nofollow" className="underline break-all">{r.proof_link}</a> <ExternalLink className="h-3 w-3" /></p>
                  )}
                  {r.message && <p className="whitespace-pre-wrap">“{r.message}”</p>}
                  {r.created_at && <p>Sent {new Date(r.created_at).toLocaleString()}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </VaultFrame>
  )
}
