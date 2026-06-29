import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

const ADMINS = (process.env.ADMIN_USERNAMES ?? 'jakob25,admin').split(',').map(s => s.trim())

export async function GET(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session
  if (!ADMINS.includes(session.username)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10), 200)

  const { data, error } = await supabaseAdmin
    .from('admin_audit_log')
    .select('id, actor, action, target_type, target_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ entries: [], migrationRequired: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: data ?? [] })
}