import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionUser } from '@/lib/session'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function GET(req: NextRequest) {
  const vtuberId = req.nextUrl.searchParams.get('vtuberId')
  if (!vtuberId) return NextResponse.json({ error: 'vtuberId is required.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('schedule_votes')
    .select('*')
    .eq('vtuber_id', vtuberId)
    .order('votes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ proposals: [] })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const proposals = (data ?? []).map(p => ({
    ...p,
    dayLabel: DAYS[p.proposed_day] ?? String(p.proposed_day),
  }))
  return NextResponse.json({ proposals })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { vtuberId, proposedDay, proposedTime, label } = await req.json()
  if (!vtuberId || proposedDay == null || !proposedTime?.trim()) {
    return NextResponse.json({ error: 'vtuberId, proposedDay, and proposedTime are required.' }, { status: 400 })
  }
  if (proposedDay < 0 || proposedDay > 6) {
    return NextResponse.json({ error: 'proposedDay must be 0–6.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('schedule_votes').insert({
    vtuber_id: vtuberId,
    proposed_day: proposedDay,
    proposed_time: proposedTime.trim(),
    label: label?.trim() ?? null,
    votes: 0,
    created_by: user.username,
    created_at: new Date().toISOString(),
  })

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ error: 'Schedule voting not available yet — run migration 002.' }, { status: 503 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { proposalId } = await req.json()
  if (!proposalId) return NextResponse.json({ error: 'proposalId is required.' }, { status: 400 })

  const { data: proposal } = await supabaseAdmin
    .from('schedule_votes')
    .select('votes')
    .eq('id', proposalId)
    .single()

  if (!proposal) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('schedule_votes')
    .update({ votes: (proposal.votes ?? 0) + 1 })
    .eq('id', proposalId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}