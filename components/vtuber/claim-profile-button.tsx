'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { normalizeRole } from '@/lib/roles'
import { ShieldCheck } from 'lucide-react'

interface Props {
  vtuberId: string
  vtuberName: string
  claimedBy: string | null
}

export function ClaimProfileButton({ vtuberId, vtuberName, claimedBy }: Props) {
  const { user } = useAuth()
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const role = normalizeRole(user?.role ?? null)
  const canClaim = user && (role === 'VTuber' || role === 'Creator') && !claimedBy

  if (!user) return null
  if (claimedBy === user.username) {
    return (
      <p className="text-xs text-vault-gold flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" /> You manage this profile
      </p>
    )
  }
  if (claimedBy) return null
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
      setMessage(`Claimed ${vtuberName}!`)
    } catch (err: unknown) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Claim failed')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
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
        <p className={`text-xs ${status === 'error' ? 'text-red-400' : 'text-vault-gold'}`}>{message}</p>
      )}
    </div>
  )
}