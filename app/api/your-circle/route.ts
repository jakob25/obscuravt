import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'
import { STREAM_PREDICTION_CATEGORY } from '@/lib/stream-predictions'
import type { CircleFeedItem, CircleOshi, YourCircleResponse } from '@/lib/types'
import { MAX_CIRCLE_SIZE } from '@/lib/types'

function parseFavoriteIds(raw: string | null | undefined): string[] {
  if (!raw) return []
  return [...new Set(raw.split(',').map(s => s.trim()).filter(Boolean))].slice(0, MAX_CIRCLE_SIZE)
}

function getNextScheduleSlot(
  slots: Array<{ id: string; day_of_week: number; start_time: string; timezone: string; label: string | null }>,
): typeof slots[0] | null {
  if (slots.length === 0) return null
  const now = new Date()
  const today = now.getDay()
  const nowMins = now.getHours() * 60 + now.getMinutes()

  let best: { slot: typeof slots[0]; daysUntil: number } | null = null
  for (const slot of slots) {
    const [h, m] = slot.start_time.split(':').map(Number)
    const slotMins = h * 60 + m
    let daysUntil = (slot.day_of_week - today + 7) % 7
    if (daysUntil === 0 && slotMins <= nowMins) daysUntil = 7
    if (!best || daysUntil < best.daysUntil) best = { slot, daysUntil }
  }
  return best?.slot ?? slots[0]
}

export async function GET(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { data: userRow, error: userErr } = await supabaseAdmin
    .from('users')
    .select('favorite_vtubers')
    .eq('username', session.username)
    .single()

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

  const ids = parseFavoriteIds(userRow?.favorite_vtubers)
  if (ids.length === 0) {
    return NextResponse.json({ oshis: [], items: [] } satisfies YourCircleResponse)
  }

  const { data: vtuberRows, error: vtuberErr } = await supabaseAdmin
    .from('vtubers')
    .select('id, name, avatar_url')
    .in('id', ids)
    .eq('approved', true)

  if (vtuberErr) return NextResponse.json({ error: vtuberErr.message }, { status: 500 })

  const oshis: CircleOshi[] = (vtuberRows ?? []).map(v => ({
    id: v.id,
    name: v.name,
    avatar_url: v.avatar_url ?? null,
  }))

  const idSet = new Set(oshis.map(o => o.id))
  const nameById = Object.fromEntries(oshis.map(o => [o.id, o.name]))
  const names = oshis.map(o => o.name)

  const [clipsRes, goalsRes, betsRes, schedulesRes, memesRes, qaRes, karaokeRes, votesRes] = await Promise.all([
    supabaseAdmin
      .from('clips')
      .select('id, profile_id, title, upvotes, clip_url, created_at, vtuber_name')
      .in('profile_id', [...idSet])
      .order('created_at', { ascending: false })
      .limit(15),
    supabaseAdmin
      .from('cmdmi_goals')
      .select('id, idea_id, profile_id, goal_amount, funded_amount, status, created_at')
      .in('profile_id', [...idSet])
      .eq('status', 'active'),
    supabaseAdmin
      .from('bets')
      .select('id, title, vtuber_name, status, created_at')
      .eq('category', STREAM_PREDICTION_CATEGORY)
      .in('status', ['open', 'voting', 'closed'])
      .in('vtuber_name', names.length > 0 ? names : ['__none__'])
      .order('created_at', { ascending: false })
      .limit(15),
    supabaseAdmin
      .from('stream_schedules')
      .select('id, vtuber_id, day_of_week, start_time, timezone, label')
      .in('vtuber_id', [...idSet]),
    supabaseAdmin
      .from('memes')
      .select('id, vtuber_id, caption, upvotes, share_slug, created_at')
      .in('vtuber_id', [...idSet])
      .order('created_at', { ascending: false })
      .limit(12),
    supabaseAdmin
      .from('qa_sessions')
      .select('id, vtuber_id, title, status, created_at')
      .in('vtuber_id', [...idSet])
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(12),
    supabaseAdmin
      .from('karaoke_requests')
      .select('id, vtuber_id, song_title, artist, upvotes, status, created_at')
      .in('vtuber_id', [...idSet])
      .in('status', ['queued', 'pending'])
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(12),
    supabaseAdmin
      .from('schedule_votes')
      .select('id, vtuber_id, proposed_day, proposed_time, label, votes, created_at')
      .in('vtuber_id', [...idSet])
      .order('votes', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (clipsRes.error) return NextResponse.json({ error: clipsRes.error.message }, { status: 500 })
  if (goalsRes.error) return NextResponse.json({ error: goalsRes.error.message }, { status: 500 })
  if (betsRes.error) return NextResponse.json({ error: betsRes.error.message }, { status: 500 })
  if (schedulesRes.error) return NextResponse.json({ error: schedulesRes.error.message }, { status: 500 })
  if (memesRes.error && memesRes.error.code !== '42P01') return NextResponse.json({ error: memesRes.error.message }, { status: 500 })
  if (qaRes.error && qaRes.error.code !== '42P01') return NextResponse.json({ error: qaRes.error.message }, { status: 500 })
  if (karaokeRes.error && karaokeRes.error.code !== '42P01') return NextResponse.json({ error: karaokeRes.error.message }, { status: 500 })
  if (votesRes.error && votesRes.error.code !== '42P01') return NextResponse.json({ error: votesRes.error.message }, { status: 500 })

  const ideaIds = [...new Set((goalsRes.data ?? []).map(g => g.idea_id))]
  let ideaTitleById: Record<string, string> = {}
  if (ideaIds.length > 0) {
    const { data: ideas } = await supabaseAdmin
      .from('cmdmi_ideas')
      .select('id, title')
      .in('id', ideaIds)
    ideaTitleById = Object.fromEntries((ideas ?? []).map(i => [i.id, i.title]))
  }

  const nameToId = Object.fromEntries(oshis.map(o => [o.name.toLowerCase(), o.id]))
  const items: CircleFeedItem[] = []

  for (const g of goalsRes.data ?? []) {
    if (!idSet.has(g.profile_id)) continue
    items.push({
      kind: 'cmdmi_goal',
      id: g.id,
      vtuberId: g.profile_id,
      vtuberName: nameById[g.profile_id] ?? 'Unknown',
      ideaTitle: ideaTitleById[g.idea_id] ?? 'Stream idea',
      goalId: g.id,
      fundedAmount: g.funded_amount ?? 0,
      goalAmount: g.goal_amount ?? 0,
      sortAt: g.created_at,
      priority: 0,
    })
  }

  for (const b of betsRes.data ?? []) {
    const vtuberId = nameToId[b.vtuber_name?.toLowerCase() ?? ''] ?? ''
    if (!vtuberId) continue
    items.push({
      kind: 'prediction',
      id: b.id,
      vtuberId,
      vtuberName: b.vtuber_name,
      title: b.title,
      status: b.status,
      sortAt: b.created_at,
      priority: b.status === 'open' ? 1 : 2,
    })
  }

  for (const c of clipsRes.data ?? []) {
    const vtuberId = c.profile_id ?? ''
    if (!vtuberId || !idSet.has(vtuberId)) continue
    items.push({
      kind: 'clip',
      id: c.id,
      vtuberId,
      vtuberName: c.vtuber_name ?? nameById[vtuberId] ?? 'Unknown',
      title: c.title,
      upvotes: c.upvotes ?? 0,
      clipUrl: c.clip_url,
      sortAt: c.created_at,
      priority: 3,
    })
  }

  const schedulesByVtuber = new Map<string, typeof schedulesRes.data>()
  for (const s of schedulesRes.data ?? []) {
    const list = schedulesByVtuber.get(s.vtuber_id) ?? []
    list.push(s)
    schedulesByVtuber.set(s.vtuber_id, list)
  }

  for (const [vtuberId, slots] of schedulesByVtuber) {
    const next = getNextScheduleSlot(slots ?? [])
    if (!next) continue
    items.push({
      kind: 'schedule',
      id: next.id,
      vtuberId,
      vtuberName: nameById[vtuberId] ?? 'Unknown',
      dayOfWeek: next.day_of_week,
      startTime: next.start_time,
      timezone: next.timezone,
      label: next.label,
      sortAt: new Date().toISOString(),
      priority: 5,
    })
  }

  for (const m of memesRes.data ?? []) {
    if (!m.vtuber_id || !idSet.has(m.vtuber_id)) continue
    items.push({
      kind: 'meme',
      id: m.id,
      vtuberId: m.vtuber_id,
      vtuberName: nameById[m.vtuber_id] ?? 'Unknown',
      caption: m.caption ?? '',
      shareSlug: m.share_slug,
      upvotes: m.upvotes ?? 0,
      sortAt: m.created_at,
      priority: 3,
    })
  }

  for (const s of qaRes.data ?? []) {
    if (!idSet.has(s.vtuber_id)) continue
    items.push({
      kind: 'qa_session',
      id: s.id,
      vtuberId: s.vtuber_id,
      vtuberName: nameById[s.vtuber_id] ?? 'Unknown',
      title: s.title,
      status: s.status,
      sortAt: s.created_at,
      priority: 1,
    })
  }

  const karaokeSeen = new Set<string>()
  for (const k of karaokeRes.data ?? []) {
    if (!idSet.has(k.vtuber_id) || karaokeSeen.has(k.vtuber_id)) continue
    karaokeSeen.add(k.vtuber_id)
    items.push({
      kind: 'karaoke',
      id: k.id,
      vtuberId: k.vtuber_id,
      vtuberName: nameById[k.vtuber_id] ?? 'Unknown',
      songTitle: k.song_title,
      artist: k.artist ?? '',
      upvotes: k.upvotes ?? 0,
      status: k.status,
      sortAt: k.created_at,
      priority: k.status === 'queued' ? 2 : 3,
    })
  }

  const voteSeen = new Set<string>()
  for (const v of votesRes.data ?? []) {
    if (!idSet.has(v.vtuber_id) || voteSeen.has(v.vtuber_id)) continue
    voteSeen.add(v.vtuber_id)
    items.push({
      kind: 'schedule_vote',
      id: v.id,
      vtuberId: v.vtuber_id,
      vtuberName: nameById[v.vtuber_id] ?? 'Unknown',
      proposedDay: v.proposed_day,
      proposedTime: v.proposed_time,
      label: v.label,
      votes: v.votes ?? 0,
      sortAt: v.created_at,
      priority: 2,
    })
  }

  items.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime()
  })

  return NextResponse.json({ oshis, items: items.slice(0, 20) } satisfies YourCircleResponse)
}