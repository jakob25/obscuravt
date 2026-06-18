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

  // Simple admin check (you can improve this later)
  const isAdmin = username === 'blujayrx' || username === process.env.NEXT_PUBLIC_ADMIN_USERNAME

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
      if (!res.ok) throw new Error('Failed to load claims')
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
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, action }),
      })

      if (!res.ok) throw new Error('Action failed')

      // Refresh list
      await fetchClaims()
    } catch (err) {
      alert('Failed to process claim')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) return <div className="p-8">Loading claims...</div>

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Claim Requests</h1>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {claims.length === 0 ? (
        <p className="text-white/60">No pending claim requests.</p>
      ) : (
        <div className="space-y-6">
          {claims.map((claim) => (
            <div key={claim.id} className="bg-[#111] border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{claim.vtuber_name || claim.vtuber_id}</div>
                  <div className="text-sm text-white/60 mt-1">
                    Requested by: <span className="text-vault-gold">{claim.requested_by}</span>
                  </div>
                  {claim.proof_link && (
                    <a 
                      href={claim.proof_link} 
                      target="_blank" 
                      className="text-sm text-cyan-400 hover:underline mt-2 block"
                    >
                      View Proof →
                    </a>
                  )}
                  {claim.message && (
                    <p className="mt-3 text-sm text-white/80">{claim.message}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(claim.id, 'approve')}
                    disabled={!!processing}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm disabled:opacity-50"
                  >
                    {processing === claim.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleAction(claim.id, 'reject')}
                    disabled={!!processing}
                    className="px-5 py-2 bg-red-600/80 hover:bg-red-700 rounded-lg text-sm disabled:opacity-50"
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
