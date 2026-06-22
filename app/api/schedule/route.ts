import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionUser } from '@/lib/session'

// ── GET: get a vtuber's weekly schedule ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const vtuberId = req.nextUrl.searchParams.get('vtuberId')
  if (!vtuberId) {
    return NextResponse.json({ error: 'vtuberId is required.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('stream_schedules')
    .select('*')
    .eq('vtuber_id', vtuberId)
    .order('day_of_week')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedule: data ?? [] })
}

// ── POST: creator adds a schedule slot ────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { vtuberId, dayOfWeek, startTime, timezone, label } = await req.json()
  if (!vtuberId || dayOfWeek == null || !startTime || !timezone) {
    return NextResponse.json({ error: 'vtuberId, dayOfWeek, startTime, and timezone are required.' }, { status: 400 })
  }

  const { data: vtuber } = await supabaseAdmin
    .from('vtubers')
    .select('id')
    .eq('id', vtuberId)
    .eq('claimed_by', user.username)
    .single()

  if (!vtuber) {
    return NextResponse.json({ error: 'You do not own this profile.' }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from('stream_schedules').insert({
    id: crypto.randomUUID(),
    vtuber_id: vtuberId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    timezone,
    label: label ?? null,
    created_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// ── DELETE: creator removes a schedule slot ───────────────────────────────────
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })

  const { data: slot } = await supabaseAdmin.from('stream_schedules').select('vtuber_id').eq('id', id).single()
  if (!slot) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const { data: vtuber } = await supabaseAdmin
    .from('vtubers')
    .select('id')
    .eq('id', slot.vtuber_id)
    .eq('claimed_by', user.username)
    .single()

  if (!vtuber) {
    return NextResponse.json({ error: 'You do not own this profile.' }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from('stream_schedules').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
