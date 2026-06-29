import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { item_id } = await req.json()
  if (!item_id) return NextResponse.json({ error: 'item_id is required.' }, { status: 400 })

  const username = session.username

  const { data: owned } = await supabaseAdmin
    .from('user_cosmetics')
    .select('id, item_id')
    .eq('username', username)
    .eq('item_id', item_id)
    .single()

  if (!owned) return NextResponse.json({ error: 'You do not own this item.' }, { status: 404 })

  const { data: item } = await supabaseAdmin
    .from('cosmetic_items')
    .select('type')
    .eq('id', item_id)
    .single()

  if (!item) return NextResponse.json({ error: 'Item not found.' }, { status: 404 })

  const { data: equippedRows } = await supabaseAdmin
    .from('user_cosmetics')
    .select('id, item_id')
    .eq('username', username)
    .eq('equipped', true)

  if (equippedRows?.length) {
    const itemIds = equippedRows.map(r => r.item_id)
    const { data: itemTypes } = await supabaseAdmin
      .from('cosmetic_items')
      .select('id, type')
      .in('id', itemIds)

    const sameTypeIds = (itemTypes ?? [])
      .filter(t => t.type === item.type)
      .map(t => t.id)

    const toUnequip = equippedRows.filter(r => sameTypeIds.includes(r.item_id))
    for (const row of toUnequip) {
      await supabaseAdmin.from('user_cosmetics').update({ equipped: false }).eq('id', row.id)
    }
  }

  await supabaseAdmin.from('user_cosmetics').update({ equipped: true }).eq('id', owned.id)

  return NextResponse.json({ ok: true, equipped: item_id })
}