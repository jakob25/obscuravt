import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10), 200)

  const { data, error } = await supabaseAdmin
    .from('admin_audit_log')
    .select('id, actor, action, target_type, target_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    // 42P01 = undefined table (Postgres)
    // PGRST205 = relation not found in schema cache (PostgREST)
    if (error.code === '42P01' || error.code === 'PGRST205' || /schema cache/i.test(error.message ?? '')) {
      return NextResponse.json({ entries: [], migrationRequired: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: data ?? [] })
}
