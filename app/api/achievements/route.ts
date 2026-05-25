import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
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
