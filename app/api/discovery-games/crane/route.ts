import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/session'
import { resolveAvatarUrl } from '@/lib/discovery-games'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('vtubers')
    .select('id, name, bio, tags, avatar_url')
    .eq('approved', true)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const prizes = (data ?? []).map(row => {
    const tags: string[] = row.tags ?? []
    return {
      id: row.id,
      name: row.name,
      bio: row.bio ?? '',
      category: tags.find((t: string) => t.startsWith('clust_')) ?? 'clust_variety',
      avatarUrl: resolveAvatarUrl(row.id, row.avatar_url),
    }
  })

  return NextResponse.json({ prizes })
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { vtuberId } = await req.json()
  if (!vtuberId) {
    return NextResponse.json({ error: 'vtuberId is required.' }, { status: 400 })
  }

  const { data: vtuber } = await supabaseAdmin
    .from('vtubers')
    .select('id, name, avatar_url')
    .eq('id', vtuberId)
    .eq('approved', true)
    .single()

  if (!vtuber) return NextResponse.json({ error: 'Prize not found.' }, { status: 404 })

  const { error } = await supabaseAdmin.from('crane_catches').insert({
    username: session.username,
    vtuber_id: vtuberId,
    created_at: new Date().toISOString(),
  })

  if (error && error.code !== '42P01') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    prize: {
      id: vtuber.id,
      name: vtuber.name,
      avatarUrl: resolveAvatarUrl(vtuber.id, vtuber.avatar_url),
    },
  })
}