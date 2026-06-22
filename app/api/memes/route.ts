import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionUser } from '@/lib/session'

export async function GET(req: NextRequest) {
  const vtuberId = req.nextUrl.searchParams.get('vtuberId')

  let query = supabaseAdmin
    .from('memes')
    .select('*')
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(40)

  if (vtuberId) query = query.eq('vtuber_id', vtuberId)

  const { data, error } = await query
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ memes: [] })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ memes: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { vtuberId, imageUrl, caption } = await req.json()
  if (!imageUrl?.trim()) {
    return NextResponse.json({ error: 'imageUrl is required.' }, { status: 400 })
  }

  const shareSlug = `meme_${randomBytes(6).toString('hex')}`
  const { data, error } = await supabaseAdmin.from('memes').insert({
    vtuber_id: vtuberId ?? null,
    submitted_by: user.username,
    image_url: imageUrl.trim(),
    caption: caption?.trim() ?? '',
    share_slug: shareSlug,
    upvotes: 0,
    created_at: new Date().toISOString(),
  }).select('id,share_slug').single()

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ error: 'Memes not available yet — run migration 002.' }, { status: 503 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: data?.id, shareSlug: data?.share_slug })
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { memeId } = await req.json()
  if (!memeId) return NextResponse.json({ error: 'memeId is required.' }, { status: 400 })

  const { data: meme } = await supabaseAdmin.from('memes').select('upvotes').eq('id', memeId).single()
  if (!meme) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const { error } = await supabaseAdmin.from('memes').update({ upvotes: (meme.upvotes ?? 0) + 1 }).eq('id', memeId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}