import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const { bet_id, username, option, amount } = await req.json()

  if (!bet_id || !username || !option || !amount)
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

  // Check existing entry
  const { data: existing } = await supabaseAdmin
    .from('bet_entries')
    .select('id')
    .eq('bet_id', bet_id)
    .eq('username', username)
    .single()

  if (existing)
    return NextResponse.json({ error: 'Already placed a bet on this.' }, { status: 409 })

  // Check user balance
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('coins,bets_placed')
    .eq('username', username)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  if (user.coins < amount) return NextResponse.json({ error: 'Insufficient coins.' }, { status: 400 })

  // Place entry
  await supabaseAdmin.from('bet_entries').insert({
    id: randomUUID(),
    bet_id,
    username,
    option,
    amount,
    created_at: new Date().toISOString(),
  })

  // Deduct coins
  await supabaseAdmin
    .from('users')
    .update({ coins: user.coins - amount, bets_placed: user.bets_placed + 1 })
    .eq('username', username)

  return NextResponse.json({ ok: true })
}
