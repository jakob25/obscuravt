import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { DAILY_BONUS } from '@/lib/db-constants'
import { isValidRole } from '@/lib/roles'
import { recordScrapTransaction } from '@/lib/scrap-ledger'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { supabaseAdmin } = await import('@/lib/supabase')

  const { username } = await params
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('username,coins,role,bio,joined_at,total_won,total_lost,bets_placed,bets_correct,biggest_win,biggest_loss,last_bonus,favorite_vtubers,last_seen_version')
    .eq('username', username)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { supabaseAdmin } = await import('@/lib/supabase')
  const { username } = await params

  if (session.username !== username) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const body = await req.json()
  const update: Record<string, unknown> = {}
  if ('bio' in body) update.bio = body.bio
  if ('favorite_vtubers' in body) update.favorite_vtubers = body.favorite_vtubers
  if ('last_seen_version' in body) update.last_seen_version = body.last_seen_version
  if ('role' in body) {
    if (!isValidRole(body.role)) {
      return NextResponse.json({ error: 'Invalid role. Choose VTuber, Creator, or Fan.' }, { status: 400 })
    }
    update.role = body.role
  }

  if (body.claim_daily) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('coins,last_bonus')
      .eq('username', username)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    const now = new Date()
    if (user.last_bonus) {
      const last = new Date(user.last_bonus)
      const diffHours = (now.getTime() - last.getTime()) / 3_600_000
      if (diffHours < 20) {
        const rem = 20 - diffHours
        const h = Math.floor(rem)
        const m = Math.floor((rem - h) * 60)
        return NextResponse.json({ error: `Already claimed. Next bonus in ${h}h ${m}m.` }, { status: 429 })
      }
    }

    const newBalance = user.coins + DAILY_BONUS
    update.coins = newBalance
    update.last_bonus = now.toISOString()
    await recordScrapTransaction(username, DAILY_BONUS, newBalance, 'daily_bonus', null, 'Daily bonus')
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update(update)
    .eq('username', username)

  if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}