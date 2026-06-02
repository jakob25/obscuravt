import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('clips')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch clips.' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const body = await req.json()
  const { profile_id, title, url, description, tags } = body
  const username = session.username
  if (!title?.trim())
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  if (!url?.trim())
    return NextResponse.json({ error: 'Video URL is required.' }, { status: 400 })

  // Duplicate URL check
  const { data: existing } = await supabaseAdmin
    .from('clips')
    .select('id')
    .eq('clip_url', url.trim())
    .single()

  if (existing)
    return NextResponse.json({ error: 'This clip has already been submitted.' }, { status: 409 })

  const { error } = await supabaseAdmin.from('clips').insert({
    id: randomUUID(),
    profile_id: profile_id || null,
    submitter: username,
    title: title.trim(),
    clip_url: url.trim(),
    description: description?.trim() ?? null,
    tags: tags ?? [],
    upvotes: 0,
    created_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: 'Failed to submit clip.' }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
