import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { recordScrapTransaction } from '@/lib/scrap-ledger'

export async function POST(req: NextRequest) {
  const rl = await rateLimits.transaction(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { item_id } = await req.json()
  const username = session.username

  const { data: item } = await supabaseAdmin
    .from('cosmetic_items').select('*').eq('id', item_id).single()
  if (!item) return NextResponse.json({ error: 'Item not found.' }, { status: 404 })

  const { data: user } = await supabaseAdmin
    .from('users').select('coins').eq('username', username).single()
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  const { data: existing } = await supabaseAdmin
    .from('user_cosmetics').select('id').eq('username', username).eq('item_id', item_id).single()
  if (existing) return NextResponse.json({ error: 'Already owned.' }, { status: 409 })

  if (user.coins < item.cost)
    return NextResponse.json({ error: `Need ${item.cost.toLocaleString()} coins, have ${user.coins.toLocaleString()}.` }, { status: 400 })

  await supabaseAdmin.from('user_cosmetics').insert({
    id: randomUUID(), username, item_id, equipped: false,
    purchased_at: new Date().toISOString(),
  })
  const newBalance = user.coins - item.cost
  await supabaseAdmin.from('users').update({ coins: newBalance }).eq('username', username)
  await recordScrapTransaction(username, -item.cost, newBalance, 'shop_purchase', item_id, item.name)

  return NextResponse.json({ ok: true })
}
