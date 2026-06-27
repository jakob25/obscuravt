import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionUser } from '@/lib/session'

// ── GET: posts in a constellation/niche forum ─────────────────────────────────
export async function GET(req: NextRequest) {
  const constellationId = req.nextUrl.searchParams.get('constellationId')
  if (!constellationId) {
    return NextResponse.json({ error: 'constellationId is required.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('cluster_posts')
    .select('*')
    .eq('constellation_id', constellationId)
    .order('upvotes', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data ?? [] })
}

// ── POST: create a new post in a forum ────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { constellationId, content, vtuberId } = await req.json()
  if (!constellationId || !content) {
    return NextResponse.json({ error: 'constellationId and content are required.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('cluster_posts').insert({
    id: crypto.randomUUID(),
    constellation_id: constellationId,
    username: user.username,
    content,
    vtuber_id: vtuberId ?? null,
    upvotes: 0,
    created_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// ── PATCH: upvote a post ──────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { postId } = await req.json()
  if (!postId) return NextResponse.json({ error: 'postId is required.' }, { status: 400 })

  const { data: post } = await supabaseAdmin.from('cluster_posts').select('upvotes').eq('id', postId).single()
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })

  await supabaseAdmin.from('cluster_posts').update({ upvotes: (post.upvotes ?? 0) + 1 }).eq('id', postId)
  return NextResponse.json({ ok: true })
}
