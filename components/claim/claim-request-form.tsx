'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { CLAIM_REQUEST_LIMITS } from '@/lib/claim-requests'

interface Props {
  files: { id: string; name: string }[]
  preselected: string | null
}

/**
 * Sends a claim request that waits for a human to approve it. Nothing here links the file
 * to an account; approval happens in the admin panel.
 */
export function ClaimRequestForm({ files, preselected }: Props) {
  const { user, loading } = useAuth()
  const [vtuberId, setVtuberId] = useState(preselected ?? '')
  const [proofLink, setProofLink] = useState('')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  if (loading) return null

  if (!user) {
    return (
      <div className="text-sm text-vault-cream">
        <h2 className="text-base font-semibold mb-1">Request a claim on the site</h2>
        <p className="text-muted-foreground">
          <Link href={`/login?next=${encodeURIComponent(`/claim${preselected ? `?file=${preselected}` : ''}`)}`} className="text-vault-gold underline underline-offset-2">Sign in</Link>{' '}
          to send a claim request here instead of a DM. It stays pending until it&apos;s checked and approved by hand.
        </p>
      </div>
    )
  }

  if (state === 'sent') {
    return (
      <div role="status" className="text-sm text-vault-cream">
        <h2 className="text-base font-semibold mb-1">Request sent</h2>
        <p className="text-muted-foreground">It&apos;s pending. Once it&apos;s checked and approved by hand, the file will show up in your Creator Dashboard.</p>
      </div>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vtuberId) { setError('Pick the file you want to claim.'); setState('error'); return }
    setState('sending'); setError('')
    const res = await fetch('/api/claim-requests', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vtuberId, proofLink, message }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'Something went wrong. Try again.'); setState('error'); return }
    setState('sent')
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-sm">
      <div>
        <h2 className="text-base font-semibold text-vault-cream">Request a claim on the site</h2>
        <p className="text-xs text-muted-foreground mt-1">It stays pending until it&apos;s checked and approved by hand.</p>
      </div>
      <label className="block">
        <span className="block text-vault-cream mb-1">Your file</span>
        <select value={vtuberId} onChange={e => setVtuberId(e.target.value)} className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-vault-cream">
          <option value="">Pick your file…</option>
          {files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="block text-vault-cream mb-1">Proof link (optional)</span>
        <input
          type="url" inputMode="url" value={proofLink} maxLength={CLAIM_REQUEST_LIMITS.proofLink}
          onChange={e => setProofLink(e.target.value)}
          placeholder="https://x.com/yourname/status/…"
          className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-vault-cream placeholder:text-muted-foreground"
        />
        <span className="block text-xs text-muted-foreground mt-1">A post or bio from your VTuber account that mentions ObscuraVT helps us check it&apos;s you.</span>
      </label>
      <label className="block">
        <span className="block text-vault-cream mb-1">Anything we should know? (optional)</span>
        <textarea
          value={message} maxLength={CLAIM_REQUEST_LIMITS.message} rows={3}
          onChange={e => setMessage(e.target.value)}
          className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-vault-cream"
        />
      </label>
      {state === 'error' && error && <p role="alert" className="text-destructive text-xs">{error}</p>}
      <Button type="submit" variant="vault" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send claim request'}
      </Button>
    </form>
  )
}
