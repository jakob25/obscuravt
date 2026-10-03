import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim().toLowerCase()
  if (q.length < 2) return NextResponse.json([])

  const { data, error } = await supabaseAdmin
    .from('vtubers')
    .select('id, name, handle, avatar_url, bio')
    .eq('approved', true)
    .limit(400)

  if (error || !data) {
    return NextResponse.json([])
  }

  const compact = q.replace(/[^a-z0-9]/g, '')
  const hits = data.filter(row => {
    const name = String(row.name || '').toLowerCase()
    const handle = String(row.handle || '').toLowerCase().replace(/^@/, '')
    const bio = String(row.bio || '').toLowerCase()
    return (
      name.includes(q) ||
      handle.includes(q) ||
      bio.includes(q) ||
      (compact.length >= 3 && (name.replace(/[^a-z0-9]/g, '').includes(compact) || handle.replace(/[^a-z0-9]/g, '').includes(compact)))
    )
  }).slice(0, 24)

  return NextResponse.json(hits)
}
