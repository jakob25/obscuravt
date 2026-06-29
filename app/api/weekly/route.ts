import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/session'
import { MAX_CIRCLE_SIZE } from '@/lib/types'

function parseFavoriteIds(raw: string | null | undefined): string[] {
  if (!raw) return []
  return [...new Set(raw.split(',').map(s => s.trim()).filter(Boolean))].slice(0, MAX_CIRCLE_SIZE)
}

export async function GET(req: NextRequest) {
  const { supabaseAdmin } = await import('@/lib/supabase')

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  let circleIds: string[] = []
  let circleNames: string[] = []
  const user = await getSessionUser(req)
  if (user) {
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('favorite_vtubers')
      .eq('username', user.username)
      .single()
    circleIds = parseFavoriteIds(userRow?.favorite_vtubers)
    if (circleIds.length > 0) {
      const { data: vtuberRows } = await supabaseAdmin
        .from('vtubers')
        .select('id, name')
        .in('id', circleIds)
        .eq('approved', true)
      circleNames = (vtuberRows ?? []).map(v => v.name)
    }
  }

  let clipsQuery = supabaseAdmin
    .from('clips')
    .select('id,title,upvotes,clip_url,profile_id,created_at,vtuber_name')
    .gte('created_at', weekAgo)
    .order('upvotes', { ascending: false })
    .limit(5)
  if (circleIds.length > 0) clipsQuery = clipsQuery.in('profile_id', circleIds)

  let betsQuery = supabaseAdmin
    .from('bets')
    .select('id,title,created_at,vtuber_name')
    .gte('created_at', weekAgo)
    .order('created_at', { ascending: false })
    .limit(10)
  if (circleNames.length > 0) betsQuery = betsQuery.in('vtuber_name', circleNames)

  let vtubersQuery = supabaseAdmin
    .from('vtubers')
    .select('id,name,spotlight')
    .eq('approved', true)
    .limit(20)
  if (circleIds.length > 0) vtubersQuery = vtubersQuery.in('id', circleIds)

  const [{ data: clips }, { data: bets }, { data: vtubers }] = await Promise.all([
    clipsQuery,
    betsQuery,
    vtubersQuery,
  ])

  const topClips = (clips ?? []).map(c => ({
    id: c.id,
    title: c.title,
    upvotes: c.upvotes ?? 0,
    vtuber_name: c.profile_id ?? 'Unknown',
    clip_url: c.clip_url,
  }))

  let topBet: { id: string; title: string; entries: number } | null = null
  if (bets?.[0]) {
    const { count } = await supabaseAdmin.from('bet_entries').select('*', { count: 'exact', head: true }).eq('bet_id', bets[0].id)
    topBet = { id: bets[0].id, title: bets[0].title, entries: count ?? 0 }
  }

  const spotlight = (vtubers ?? []).find(v => v.spotlight) ?? vtubers?.[0]
  const topVtuber = spotlight ? { id: spotlight.id, name: spotlight.name, endorsements: 0 } : null

  return NextResponse.json({
    topClips,
    topBet,
    topVtuber,
    topCmdmi: null,
  })
}