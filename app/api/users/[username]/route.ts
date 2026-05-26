import { NextRequest, NextResponse } from 'next/server'
import { DAILY_BONUS } from '@/lib/db-constants'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { supabaseAdmin } = await import('@/lib/supabase')

  const { username } = await params
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('username,coins,role,bio,joined_at,total_won,total_lost,bets_placed,bets_correct,biggest_win,biggest_loss,last_bonus,favorite_vtubers')
    .eq('username', username)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  return NextResponse.json(user)
}
