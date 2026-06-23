import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionUser, requireAuth } from '@/lib/session'
import { STREAM_PREDICTION_CATEGORY } from '@/lib/stream-predictions'
import type { StreamPrediction } from '@/lib/stream-predictions'

async function mapBets(rows: Array<{
  id: string
  title: string
  description: string
  vtuber_name: string
  options: string[]
  status: string
  created_at: string
  result: string | null
}>): Promise<StreamPrediction[]> {
  return Promise.all(
    rows.map(async (b) => {
      const { data: entries } = await supabaseAdmin
        .from('bet_entries')
        .select('option, amount')
        .eq('bet_id', b.id)

      const totals: Record<string, number> = {}
      for (const e of entries ?? []) {
        totals[e.option] = (totals[e.option] ?? 0) + e.amount
      }

      return {
        id: b.id,
        title: b.title,
        description: b.description ?? '',
        vtuberName: b.vtuber_name,
        options: (b.options ?? []).map((label, i) => ({
          id: `${b.id}-opt-${i}`,
          label,
          totalScraps: totals[label] ?? 0,
        })),
        status: b.status as StreamPrediction['status'],
        createdAt: b.created_at,
        result: b.result,
      }
    }),
  )
}

export async function GET(req: NextRequest) {
  const vtuberId = req.nextUrl.searchParams.get('vtuberId')
  if (!vtuberId) {
    return NextResponse.json({ error: 'vtuberId is required.' }, { status: 400 })
  }

  const { data: vtuber } = await supabaseAdmin
    .from('vtubers')
    .select('name')
    .eq('id', vtuberId)
    .single()

  if (!vtuber) {
    return NextResponse.json({ error: 'VTuber not found.' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .from('bets')
    .select('id, title, description, vtuber_name, options, status, created_at, result')
    .eq('category', STREAM_PREDICTION_CATEGORY)
    .ilike('vtuber_name', vtuber.name)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const predictions = await mapBets(data ?? [])
  return NextResponse.json({ predictions })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { vtuberId, title, description, options } = await req.json()
  if (!vtuberId || !title?.trim() || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json({ error: 'vtuberId, title, and at least 2 options are required.' }, { status: 400 })
  }

  const cleanOptions = options.map((o: string) => o.trim()).filter(Boolean)
  if (cleanOptions.length < 2) {
    return NextResponse.json({ error: 'At least 2 non-empty options are required.' }, { status: 400 })
  }

  const { data: vtuber } = await supabaseAdmin
    .from('vtubers')
    .select('id, name, claimed_by')
    .eq('id', vtuberId)
    .single()

  if (!vtuber) return NextResponse.json({ error: 'VTuber not found.' }, { status: 404 })

  const isOwner = vtuber.claimed_by === user.username
  if (!isOwner) {
    return NextResponse.json({ error: 'Only the profile owner can create stream predictions.' }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from('bets').insert({
    id: randomUUID(),
    vtuber_name: vtuber.name,
    stream_link: '',
    game_or_activity: '',
    title: title.trim(),
    description: description?.trim() ?? '',
    options: cleanOptions,
    status: 'open',
    created_at: new Date().toISOString(),
    created_by: user.username,
    category: STREAM_PREDICTION_CATEGORY,
    result: null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}