import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { post_id } = await req.json()
  const username = session.username
  if (!post_id) return NextResponse.json({ error: 'Missing post_id.' }, { status: 400 })

  const { data: existing } = await supabaseAdmin
    .from('cluster_post_votes').select('id').eq('post_id', post_id).eq('username', username).single()
  if (existing) return NextResponse.json({ error: 'Already voted.' }, { status: 409 })

  const { data: post } = await supabaseAdmin.from('cluster_posts').select('upvotes').eq('id', post_id).single()
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })

  await supabaseAdmin.from('cluster_post_votes').insert({ id: randomUUID(), post_id, username, created_at: new Date().toISOString() })
  await supabaseAdmin.from('cluster_posts').update({ upvotes: post.upvotes + 1 }).eq('id', post_id)

  return NextResponse.json({ ok: true })
}
