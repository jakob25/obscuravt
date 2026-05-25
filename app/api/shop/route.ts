import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
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
