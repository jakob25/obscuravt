'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

type ClaimRequest = {
  id: string
  vtuber_id: string
  requested_by: string
  proof_link: string | null
  message: string | null
  status: string
  created_at: string
  vtuber_name?: string
}

export default function AdminClaimsPage() {
  const { user, username } = useAuth()
  const router = useRouter()
  const [claims, setClaims] = useState<ClaimRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const isAdmin = username === 'blujayrx' || (process.env.NEXT_PUBLIC_ADMIN_USERNAMES || '').split(',').includes(username || '')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!isAdmin) {
      router.push('/')
      return
    }
    fetchClaims()
  }, [user, isAdmin])

  const fetchClaims = async () => {
    try {
      const res = await fetch('/api/admin/claims')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setClaims(data)
    } catch (err) {
      setError('Failed to load claim requests')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (claimId: string, action: 'approve' | 'reject') => {
    setProcessing(claimId)
    setError('')
    setSuccessMessage('')

    try {
      const res = await fetch('/api/admin/claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, action }),
      })

      if (!res.ok) throw new Error('Action failed')

      const result = await res.json()
      setSuccessMessage(result.message || `Claim ${action}d successfully`)

      // Refresh list
      await fetchClaims()
    } catch (err) {
      setError('Failed to process claim. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return <div className="p-8">Loading claims...</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Claim Requests</h1>
        <div className="text-sm text-white/60">{claims.length} pending</div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6">{error}</div>}
      {successMessage && <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-lg mb-6">{successMessage}</div>}

      {claims.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          No pending claim requests.
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim.id} className="bg-[#111827] border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1">
                  <div className="font-semibold text-xl mb-1">{claim.vtuber_name || 'Unknown VTuber'}</div>
                  <div className="text-sm text-white/60 mb-4">
                    Requested by <span className="text-vault-gold font-medium">{claim.requested_by}</span> • {new Date(claim.created_at).toLocaleDateString()}
                  </div>

                  {claim.proof_link && (
                    <a href={claim.proof_link} target="_blank" className="inline-block text-sm text-cyan-400 hover:underline mb-3">
                      View Proof Link →
                    </a>
                  )}

                  {claim.message && (
                    <div className="bg-black/40 p-4 rounded-lg text-sm text-white/80">
                      {claim.message}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 min-w-[140px]">
                  <button
                    onClick={() => handleAction(claim.id, 'approve')}
                    disabled={!!processing}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    {processing === claim.id ? 'Approving...' : 'Approve Claim'}
                  </button>
                  <button
                    onClick={() => handleAction(claim.id, 'reject')}
                    disabled={!!processing}
                    className="px-6 py-2.5 bg-red-600/90 hover:bg-red-700 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
