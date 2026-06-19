'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Shield, CheckCircle, XCircle, ExternalLink, Clock } from 'lucide-react'

interface ClaimRequest {
  id: string
  vtuber_id: string
  requested_by: string
  proof_link: string
  message: string
  status: string
  created_at: string
  vtuber_name: string
}

const ADMINS = ['BLUJAYRX'] // add admin usernames here

export default function AdminClaimsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ClaimRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !ADMINS.includes(user.username?.toUpperCase())) return
    load()
  }, [user])

  const load = async () => {
    const { data: claims } = await supabase
      .from('profile_claim_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (!claims) { setLoading(false); return }

    // Enrich with vtuber names
    const ids = [...new Set(claims.map(c => c.vtuber_id))]
    const { data: vtubers } = await supabase
      .from('vtubers')
      .select('id, name')
      .in('id', ids)

    const nameMap = Object.fromEntries((vtubers ?? []).map(v => [v.id, v.name]))
    setRequests(claims.map(c => ({ ...c, vtuber_name: nameMap[c.vtuber_id] ?? c.vtuber_id })))
    setLoading(false)
  }

  const approve = async (request: ClaimRequest) => {
    setActing(request.id)
    
    // 1. Update claim request
    await supabase.from('profile_claim_requests')
      .update({ status: 'approved', reviewed_by: user!.username, reviewed_at: new Date().toISOString() })
      .eq('id', request.id)

    // 2. Mark vtuber as claimed
    await supabase.from('vtubers')
      .update({ claimed_by: request.requested_by, is_claimed: true, claim_approved_at: new Date().toISOString() })
      .eq('id', request.vtuber_id)

    // 3. Create or update vtuber_profiles row
    const { data: existing } = await supabase
      .from('vtuber_profiles')
      .select('id')
      .eq('id', request.vtuber_id)
      .single()

    if (!existing) {
      const { data: vt } = await supabase
        .from('vtubers')
        .select('name, bio')
        .eq('id', request.vtuber_id)
        .single()

      await supabase.from('vtuber_profiles').insert({
        id: request.vtuber_id,
        display_name: vt?.name ?? '',
        short_bio: vt?.bio ?? '',
        claimed_by: request.requested_by,
        is_claimed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } else {
      await supabase.from('vtuber_profiles')
        .update({ claimed_by: request.requested_by, is_claimed: true })
        .eq('id', request.vtuber_id)
    }

    // 4. Mark user as verified
    await supabase.from('users')
      .update({ is_verified: true, verified_vtuber_id: request.vtuber_id })
      .eq('username', request.requested_by)

    setActing(null)
    load()
  }

  const reject = async (request: ClaimRequest) => {
    setActing(request.id)
    await supabase.from('profile_claim_requests')
      .update({ status: 'rejected', reviewed_by: user!.username, reviewed_at: new Date().toISOString() })
      .eq('id', request.id)
    setActing(null)
    load()
  }

  if (!user || !ADMINS.includes(user.username?.toUpperCase())) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Access denied.</p>
    </div>
  )

  const pending = requests.filter(r => r.status === 'pending')
  const reviewed = requests.filter(r => r.status !== 'pending')

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="h-5 w-5 text-vault-gold" />
        <h1 className="text-2xl font-bold text-vault-cream">Claim Requests</h1>
        {pending.length > 0 && (
          <span className="ml-1 px-2 py-0.5 rounded-full bg-vault-gold/20 text-vault-gold text-xs font-semibold border border-vault-gold/30">
            {pending.length} pending
          </span>
        )}
      </div>

      {loading && <p className="text-muted-foreground text-sm animate-pulse">Loading…</p>}

      {!loading && pending.length === 0 && (
        <div className="vault-card rounded-xl p-6 text-center mb-6">
          <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No pending requests.</p>
        </div>
      )}

      {/* Pending */}
      <div className="space-y-4 mb-8">
        {pending.map(req => (
          <div key={req.id} className="vault-card rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-vault-cream">{req.requested_by}</span>
                  <span className="text-muted-foreground text-xs">wants to claim</span>
                  <span className="font-semibold text-vault-gold">{req.vtuber_name}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(req.created_at).toLocaleDateString()}
                </div>
              </div>
              <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">pending</span>
            </div>

            {req.proof_link && (
              <a href={req.proof_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-vault-gold hover:underline mb-2">
                <ExternalLink className="h-3 w-3" /> View proof
              </a>
            )}

            {req.message && (
              <p className="text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2 mb-4 italic">"{req.message}"</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => approve(req)}
                disabled={acting === req.id}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/25 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" /> Approve
              </button>
              <button
                onClick={() => reject(req)}
                disabled={acting === req.id}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/25 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reviewed history */}
      {reviewed.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">History</h2>
          <div className="space-y-2">
            {reviewed.map(req => (
              <div key={req.id} className="vault-card rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-vault-cream truncate">{req.requested_by}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-sm text-vault-gold truncate">{req.vtuber_name}</span>
                </div>
                <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${
                  req.status === 'approved'
                    ? 'bg-green-500/15 text-green-400 border-green-500/30'
                    : 'bg-red-500/15 text-red-400 border-red-500/30'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
