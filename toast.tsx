import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const vtuber_id = req.nextUrl.searchParams.get('vtuber_id')
  if (!vtuber_id) return NextResponse.json({ error: 'vtuber_id required.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('fan_art')
    .select('*')
    .eq('vtuber_id', vtuber_id)
    .eq('reported', false)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch.' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { vtuber_id, twitter_url } = await req.json()
  const submitted_by = session.username

  if (!vtuber_id || !submitted_by || !twitter_url?.trim())
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

  if (!twitter_url.includes('twitter.com') && !twitter_url.includes('x.com'))
    return NextResponse.json({ error: 'Must be a Twitter/X URL.' }, { status: 400 })

  // Duplicate check
  const { data: existing } = await supabaseAdmin
    .from('fan_art').select('id').eq('twitter_url', twitter_url.trim()).single()
  if (existing) return NextResponse.json({ error: 'This post has already been submitted.' }, { status: 409 })

  // Try to extract image URL from Twitter URL (best effort)
  // Real implementation would use Twitter oEmbed API
  const image_url = null

  const { data, error } = await supabaseAdmin.from('fan_art').insert({
    id: randomUUID(),
    vtuber_id,
    submitted_by,
    twitter_url: twitter_url.trim(),
    image_url,
    reported: false,
    created_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to submit.' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { id, action } = await req.json()

  if (action === 'report') {
    await supabaseAdmin.from('fan_art').update({ reported: true }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
