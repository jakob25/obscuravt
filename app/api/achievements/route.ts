import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { supabaseAdmin } = await import('@/lib/supabase')

  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')

  const { data: achievements } = await supabaseAdmin.from('achievements').select('*')

  if (username) {
    const { data: badges } = await supabaseAdmin
      .from('user_badges')
      .select('*')
      .eq('username', username)
    return NextResponse.json({ achievements: achievements ?? [], badges: badges ?? [] })
  }

  return NextResponse.json(achievements ?? [])
}