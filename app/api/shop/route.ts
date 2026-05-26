import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { supabaseAdmin } = await import('@/lib/supabase')

  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')

  const { data: items } = await supabaseAdmin.from('cosmetic_items').select('*').order('cost')

  if (username) {
    const { data: owned } = await supabaseAdmin
      .from('user_cosmetics')
      .select('*')
      .eq('username', username)
    return NextResponse.json({ items: items ?? [], owned: owned ?? [] })
  }

  return NextResponse.json(items ?? [])
}
