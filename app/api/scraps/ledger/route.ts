import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '30', 10), 100)

  const { data, error } = await supabaseAdmin
    .from('scrap_transactions')
    .select('id, amount, balance_after, kind, note, reference_id, created_at')
    .eq('username', session.username)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ transactions: [], migrationRequired: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ transactions: data ?? [] })
}