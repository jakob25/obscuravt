import { NextResponse } from 'next/server'

export async function GET() {
  const { supabaseAdmin } = await import('@/lib/supabase')

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: clips }, { data: bets }, { data: vtubers }] = await Promise.all([
    supabaseAdmin.from('clips').select('id,title,upvotes,clip_url,profile_id,created_at').gte('created_at', weekAgo).order('upvotes', { ascending: false }).limit(5),
    supabaseAdmin.from('bets').select('id,title,created_at').gte('created_at', weekAgo).order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('vtubers').select('id,name,spotlight').eq('approved', true).limit(20),
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