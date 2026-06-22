import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
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
  const allowed = ['bio', 'role', 'favorite_vtubers']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
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

    update.coins = user.coins + DAILY_BONUS
    update.last_bonus = now.toISOString()
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update(update)
    .eq('username', username)

  if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}