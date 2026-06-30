'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { normalizeRole } from '@/lib/roles'
import { ShieldCheck, Clock, AlertCircle } from 'lucide-react'

interface Props {
  vtuberId: string
  vtuberName: string
  claimedBy: string | null
  approved?: boolean
}

export function ClaimProfileButton({ vtuberId, vtuberName, claimedBy, approved = true }: Props) {
  const { user } = useAuth()
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const role = normalizeRole(user?.role ?? null)
  const canClaim = user && role === 'VTuber' && !claimedBy && approved

  if (!user) return null
  if (claimedBy === user.username) {
    return (
      <p className="text-xs text-vault-gold flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" /> You manage this profile
      </p>
    )
  }
  if (claimedBy) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" /> Claimed by @{claimedBy}
      </p>
    )
  }
  if (!approved) {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <p className="text-xs text-amber-400 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Pending admin approval
        </p>
        <Link href="/nominator" className="text-[10px] text-vault-gold hover:underline">
          Nomination status →
        </Link>
      </div>
    )
  }
  if (!canClaim) return null

  const claim = async () => {
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/vtubers/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ vtuberId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Claim failed')
      setStatus('done')
      setMessage(`Claimed ${vtuberName}! Open Creator Dashboard to manage it.`)
    } catch (err: unknown) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Claim failed')
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={claim}
        disabled={status === 'loading' || status === 'done'}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-vault-gold text-vault-deep hover:bg-vault-amber disabled:opacity-60"
      >
        <ShieldCheck className="h-4 w-4" />
        {status === 'loading' ? 'Claiming…' : status === 'done' ? 'Claimed' : 'Claim Profile'}
      </button>
      {message && (
        <p className={`text-xs max-w-[220px] ${status === 'error' ? 'text-red-400 flex items-center gap-1' : 'text-vault-gold'}`}>
          {status === 'error' && <AlertCircle className="h-3 w-3 shrink-0" />}
          {message}
        </p>
      )}
      {status === 'done' && (
        <Link href="/creator" className="text-[10px] text-vault-gold hover:underline">Creator dashboard →</Link>
      )}
    </div>
  )
}