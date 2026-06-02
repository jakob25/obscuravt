import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const vtuber_id = req.nextUrl.searchParams.get('vtuber_id')
  if (!vtuber_id) return NextResponse.json({ error: 'vtuber_id required.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('stream_schedules')
    .select('*')
    .eq('vtuber_id', vtuber_id)
    .order('day_of_week')

  if (error) return NextResponse.json({ error: 'Failed to fetch.' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { vtuber_id, day_of_week, start_time, timezone, label } = await req.json()

  if (!vtuber_id || day_of_week === undefined || !start_time)
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('stream_schedules').insert({
    id: randomUUID(),
    vtuber_id,
    day_of_week,
    start_time,
    timezone: timezone ?? 'UTC',
    label: label?.trim() ?? null,
    created_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to save schedule.' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await supabaseAdmin.from('stream_schedules').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
