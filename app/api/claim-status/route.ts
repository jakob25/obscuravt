import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const vtuberId = req.nextUrl.searchParams.get('vtuberId')

  const [{ data: claimed }, { data: pending }] = await Promise.all([
    supabaseAdmin
      .from('user_claimed_profiles')
      .select('vtuber_id, claimed_at, vtubers(id, name, claimed_by)')
      .eq('username', session.username),
    vtuberId
      ? supabaseAdmin
          .from('vtubers')
          .select('id, name, approved, claimed_by, nominated_by')
          .eq('id', vtuberId)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ])

  const profiles = (claimed ?? []).map(row => {
    const raw = row.vtubers as { id: string; name: string; claimed_by: string | null } | { id: string; name: string; claimed_by: string | null }[] | null
    const v = Array.isArray(raw) ? raw[0] : raw
    return {
      vtuberId: row.vtuber_id,
      name: v?.name ?? row.vtuber_id,
      claimedAt: row.claimed_at,
      status: 'claimed' as const,
    }
  })

  let targetStatus: { vtuberId: string; name: string; status: string; reason?: string } | null = null
  if (pending) {
    if (!pending.approved) {
      targetStatus = {
        vtuberId: pending.id,
        name: pending.name,
        status: 'pending_approval',
        reason: 'Nomination awaiting admin review.',
      }
    } else if (pending.claimed_by && pending.claimed_by !== session.username) {
      targetStatus = {
        vtuberId: pending.id,
        name: pending.name,
        status: 'claimed_by_other',
        reason: `Managed by @${pending.claimed_by}.`,
      }
    } else if (!pending.claimed_by) {
      targetStatus = {
        vtuberId: pending.id,
        name: pending.name,
        status: 'available',
      }
    }
  }

  return NextResponse.json({ profiles, targetStatus })
}