import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionUser } from '@/lib/session'

// ── GET: gallery feed, optionally scoped to a vtuber ──────────────────────────
export async function GET(req: NextRequest) {
  const vtuberId = req.nextUrl.searchParams.get('vtuberId')

  let query = supabaseAdmin
    .from('fan_art')
    .select('*')
    .eq('reported', false)
    .order('created_at', { ascending: false })
    .limit(60)

  if (vtuberId) query = query.eq('vtuber_id', vtuberId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ art: data ?? [] })
}

// ── POST: submit fan art (a Twitter/X link, optionally with a direct image URL) ──
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { vtuberId, twitterUrl, imageUrl } = await req.json()
  if (!vtuberId || !twitterUrl) {
    return NextResponse.json({ error: 'vtuberId and twitterUrl are required.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('fan_art').insert({
    id: crypto.randomUUID(),
    vtuber_id: vtuberId,
    submitted_by: user.username,
    twitter_url: twitterUrl,
    image_url: imageUrl ?? null,
    reported: false,
    created_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// ── PATCH: report a submission (any signed-in user can flag) ─────────────────
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { artId } = await req.json()
  if (!artId) return NextResponse.json({ error: 'artId required.' }, { status: 400 })

  const { error } = await supabaseAdmin.from('fan_art').update({ reported: true }).eq('id', artId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
