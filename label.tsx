import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { parsePhotoUrl } from '@/lib/photo-utils'

export async function GET(req: NextRequest) {
  const vtuber_id = req.nextUrl.searchParams.get('vtuber_id')
  if (!vtuber_id) return NextResponse.json({ error: 'vtuber_id required.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('photo_gallery')
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

  const { vtuber_id, url, caption } = await req.json()
  const submitted_by = session.username

  if (!vtuber_id || !submitted_by || !url?.trim())
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

  const parsed = parsePhotoUrl(url.trim())
  if (!parsed)
    return NextResponse.json({ error: 'Could not parse this URL. Please use Glass, Flickr, 500px, Imgur, Twitter/X, or a direct image link.' }, { status: 400 })

  const { error } = await supabaseAdmin.from('photo_gallery').insert({
    id: randomUUID(),
    vtuber_id,
    submitted_by,
    url: url.trim(),
    source_platform: parsed.platform,
    caption: caption?.trim() ?? null,
    reported: false,
    created_at: new Date().toISOString(),
  })

  if (error?.code === '23505')
    return NextResponse.json({ error: 'This photo has already been added.' }, { status: 409 })
  if (error)
    return NextResponse.json({ error: 'Failed to save photo.' }, { status: 500 })

  return NextResponse.json({ ok: true, platform: parsed.platform }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json()
  await supabaseAdmin.from('photo_gallery').update({ reported: true }).eq('id', id)
  return NextResponse.json({ ok: true })
}
