import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { parseBody, placeBetSchema } from '@/lib/validation'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const rl = await rateLimits.transaction(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const parsed = await parseBody(req, placeBetSchema)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const { bet_id, option, amount } = parsed.data
  const username = session.username  // ← from verified session, NOT body

  const { data: existing } = await supabaseAdmin
    .from('bet_entries').select('id').eq('bet_id', bet_id).eq('username', username).single()
  if (existing)
    return NextResponse.json({ error: 'Already placed a bet on this.' }, { status: 409 })

  // Re-verify balance server-side — never trust client
  const { data: user } = await supabaseAdmin
    .from('users').select('coins, bets_placed').eq('username', username).single()
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  if (user.coins < amount)
    return NextResponse.json({ error: `Insufficient scraps. You have ${user.coins.toLocaleString()}.` }, { status: 400 })

  // Verify bet is still open
  const { data: bet } = await supabaseAdmin
    .from('bets').select('status, options').eq('id', bet_id).single()
  if (!bet || bet.status !== 'open')
    return NextResponse.json({ error: 'Bet is not open.' }, { status: 400 })

  // Verify option exists on this bet
  if (!bet.options.includes(option))
    return NextResponse.json({ error: 'Invalid option.' }, { status: 400 })

  await supabaseAdmin.from('bet_entries').insert({
    id: randomUUID(), bet_id, username, option, amount,
    created_at: new Date().toISOString(),
  })
  await supabaseAdmin.from('users').update({
    coins: user.coins - amount, bets_placed: user.bets_placed + 1,
  }).eq('username', username)

  return NextResponse.json({ ok: true })
}
