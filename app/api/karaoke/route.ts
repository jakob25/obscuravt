import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionUser } from '@/lib/session'
import { ownsVtuber } from '@/lib/owns-vtuber'

const VALID_STATUS = ['pending', 'queued', 'done', 'rejected'] as const

export async function GET(req: NextRequest) {
  const vtuberId = req.nextUrl.searchParams.get('vtuberId')
  if (!vtuberId) return NextResponse.json({ error: 'vtuberId is required.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('karaoke_requests')
    .select('*')
    .eq('vtuber_id', vtuberId)
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ requests: [] })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ requests: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { vtuberId, songTitle, artist } = await req.json()
  if (!vtuberId || !songTitle?.trim()) {
    return NextResponse.json({ error: 'vtuberId and songTitle are required.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('karaoke_requests').insert({
    vtuber_id: vtuberId,
    requested_by: user.username,
    song_title: songTitle.trim(),
    artist: artist?.trim() ?? '',
    status: 'pending',
    upvotes: 0,
    created_at: new Date().toISOString(),
  })

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ error: 'Karaoke not available yet — run migration 002.' }, { status: 503 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { requestId, upvote, status } = await req.json()
  if (!requestId) return NextResponse.json({ error: 'requestId is required.' }, { status: 400 })

  const { data: row } = await supabaseAdmin
    .from('karaoke_requests')
    .select('vtuber_id,upvotes,status')
    .eq('id', requestId)
    .single()

  if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  if (upvote) {
    await supabaseAdmin.from('karaoke_requests').update({ upvotes: (row.upvotes ?? 0) + 1 }).eq('id', requestId)
    return NextResponse.json({ ok: true })
  }

  if (status) {
    if (!VALID_STATUS.includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }
    if (!await ownsVtuber(user.username, row.vtuber_id)) {
      return NextResponse.json({ error: 'You do not own this profile.' }, { status: 403 })
    }
    await supabaseAdmin.from('karaoke_requests').update({ status }).eq('id', requestId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'upvote or status required.' }, { status: 400 })
}