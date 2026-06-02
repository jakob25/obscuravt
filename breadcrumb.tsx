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

  const { clip_id } = await req.json()
  const username = session.username

  if (!clip_id)
    return NextResponse.json({ error: 'Missing clip_id.' }, { status: 400 })

  // Check already voted
  const { data: existing } = await supabaseAdmin
    .from('clip_votes')
    .select('id')
    .eq('clip_id', clip_id)
    .eq('username', username)
    .single()

  if (existing)
    return NextResponse.json({ error: 'Already voted.' }, { status: 409 })

  // Record vote
  await supabaseAdmin.from('clip_votes').insert({
    id: randomUUID(),
    clip_id,
    username,
    created_at: new Date().toISOString(),
  })

  // Increment upvotes on clip
  const { data: clip } = await supabaseAdmin
    .from('clips')
    .select('upvotes')
    .eq('id', clip_id)
    .single()

  if (clip) {
    await supabaseAdmin
      .from('clips')
      .update({ upvotes: (clip.upvotes ?? 0) + 1 })
      .eq('id', clip_id)
  }

  return NextResponse.json({ ok: true })
}
