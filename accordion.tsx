import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const monday = new Date()
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const weekStart = monday.toISOString()

  // Top 3 clips this week by upvotes
  const { data: topClips } = await supabaseAdmin
    .from('clips')
    .select('id,title,upvotes,vtuber_name,clip_url')
    .gte('created_at', weekStart)
    .order('upvotes', { ascending: false })
    .limit(3)

  // Most active bet by entries this week
  const { data: betEntries } = await supabaseAdmin
    .from('bet_entries')
    .select('bet_id')
    .gte('created_at', weekStart)

  let topBet = null
  if (betEntries?.length) {
    const counts: Record<string, number> = {}
    betEntries.forEach((e: { bet_id: string }) => { counts[e.bet_id] = (counts[e.bet_id] ?? 0) + 1 })
    const topBetId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (topBetId) {
      const { data: bet } = await supabaseAdmin.from('bets').select('id,title').eq('id', topBetId).single()
      if (bet) topBet = { ...bet, entries: counts[topBetId] }
    }
  }

  // Most endorsed new VTuber this week
  const { data: newVtubers } = await supabaseAdmin
    .from('vtubers')
    .select('id,name')
    .eq('approved', true)
    .gte('created_at', weekStart)

  let topVtuber = null
  if (newVtubers?.length) {
    const { data: upvotes } = await supabaseAdmin
      .from('vtuber_upvotes')
      .select('profile_id')
      .in('profile_id', newVtubers.map(v => v.id))
    if (upvotes?.length) {
      const counts: Record<string, number> = {}
      upvotes.forEach((u: { profile_id: string }) => { counts[u.profile_id] = (counts[u.profile_id] ?? 0) + 1 })
      const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
      const vt = newVtubers.find(v => v.id === topId)
      if (vt) topVtuber = { id: vt.id, name: vt.name, endorsements: counts[topId] ?? 0 }
    }
  }

  // Biggest CMDMI goal funded this week
  const { data: goals } = await supabaseAdmin
    .from('cmdmi_goals')
    .select('id,goal_amount,funded_amount,idea_id,profile_id')
    .eq('status', 'funded')
    .gte('completed_at', weekStart)
    .order('funded_amount', { ascending: false })
    .limit(1)

  let topCmdmi = null
  if (goals?.[0]) {
    const g = goals[0]
    const { data: idea } = await supabaseAdmin.from('cmdmi_ideas').select('title').eq('id', g.idea_id).single()
    const { data: vtuber } = await supabaseAdmin.from('vtubers').select('name').eq('id', g.profile_id).single()
    topCmdmi = {
      goal_amount: g.goal_amount,
      funded_amount: g.funded_amount,
      idea_title: idea?.title ?? 'Unknown',
      vtuber_name: vtuber?.name ?? 'Unknown',
    }
  }

  return NextResponse.json({ topClips: topClips ?? [], topBet, topVtuber, topCmdmi })
}
