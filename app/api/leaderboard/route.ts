import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    // Top 10 by coins (Winners)
    const { data: winners } = await supabaseAdmin
      .from('users')
      .select('username, coins, account_type')
      .order('coins', { ascending: false })
      .limit(10)

    // Bottom 10 by coins (Losers) - only users with coins > 0 for relevance
    const { data: losers } = await supabaseAdmin
      .from('users')
      .select('username, coins, account_type')
      .gt('coins', 0)
      .order('coins', { ascending: true })
      .limit(10)

    return NextResponse.json({
      winners: winners || [],
      losers: losers || [],
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
  }
}
