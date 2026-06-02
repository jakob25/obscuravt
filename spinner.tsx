import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const constellation_id = req.nextUrl.searchParams.get('constellation_id')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '30')

  let q = supabaseAdmin
    .from('cluster_posts')
    .select('*')
    .order('upvotes', { ascending: false })
    .limit(limit)

  if (constellation_id) q = q.eq('constellation_id', constellation_id)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: 'Failed to fetch.' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { constellation_id, content, vtuber_id } = await req.json()
  const username = session.username

  if (!constellation_id || !username || !content?.trim())
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

  if (content.trim().length > 280)
    return NextResponse.json({ error: 'Content exceeds 280 characters.' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('cluster_posts').insert({
    id: randomUUID(),
    constellation_id,
    username,
    content: content.trim(),
    vtuber_id: vtuber_id ?? null,
    upvotes: 0,
    created_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to post.' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
