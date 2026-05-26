import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { supabaseAdmin } = await import('@/lib/supabase')

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'rich'
  const limit = parseInt(searchParams.get('limit') ?? '10')

  if (type === 'rich') {
    const { data } = await supabaseAdmin
      .from('users')
      .select('username,coins,total_won,bets_placed,bets_correct')
      .order('coins', { ascending: false })
      .limit(limit)
    return NextResponse.json(data ?? [])
  }

  if (type === 'accurate') {
    const { data } = await supabaseAdmin
      .from('users')
      .select('username,bets_placed,bets_correct')
      .gte('bets_placed', 3)
    const rows = ((data ?? []) as any[]).map((r: any) => ({
      ...r,
      pct: r.bets_placed > 0 ? r.bets_correct / r.bets_placed : 0,
    })).sort((a, b) => b.pct - a.pct).slice(0, limit)
    return NextResponse.json(rows)
  }

  if (type === 'losers') {
    const { data } = await supabaseAdmin
      .from('users')
      .select('username,total_lost,biggest_loss')
      .order('total_lost', { ascending: false })
      .limit(limit)
    return NextResponse.json(data ?? [])
  }

  return NextResponse.json({ error: 'Unknown leaderboard type.' }, { status: 400 })
}
