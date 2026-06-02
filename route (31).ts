import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { username, vtuber_id, display_name, bio } = await req.json()

  if (!username || !vtuber_id)
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

  // Check not already claimed
  const { data: existing } = await supabaseAdmin
    .from('profiles').select('id').eq('vtuber_name', vtuber_id).single()
  if (existing)
    return NextResponse.json({ error: 'This profile has already been claimed.' }, { status: 409 })

  const { data: vtProfile } = await supabaseAdmin
    .from('vtubers').select('name').eq('id', vtuber_id).single()
  if (!vtProfile)
    return NextResponse.json({ error: 'VTuber not found.' }, { status: 404 })

  const { error } = await supabaseAdmin.from('profiles').insert({
    username,
    vtuber_name: vtuber_id,
    display_name: display_name?.trim() || vtProfile.name,
    avatar_url: null,
    banner_url: null,
    bio: bio?.trim() ?? '',
    vibe_tags: {},
    total_endorsements: 0,
    discoverable: true,
    claimed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: 'Failed to claim profile.' }, { status: 500 })

  // Update user role to Streamer
  await supabaseAdmin.from('users').update({ role: 'Streamer' }).eq('username', username)

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')
  const vtuber_id = req.nextUrl.searchParams.get('vtuber_id')

  let q = supabaseAdmin.from('profiles').select('*')
  if (username) q = q.eq('username', username)
  if (vtuber_id) q = q.eq('vtuber_name', vtuber_id)

  const { data } = await q.single()
  return NextResponse.json(data ?? null)
}

export async function PATCH(req: NextRequest) {
  const { username, discoverable, display_name, bio } = await req.json()
  if (!username) return NextResponse.json({ error: 'Username required.' }, { status: 400 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (discoverable !== undefined) update.discoverable = discoverable
  if (display_name !== undefined) update.display_name = display_name.trim()
  if (bio !== undefined) update.bio = bio.trim()

  const { error } = await supabaseAdmin
    .from('profiles').update(update).eq('username', username)

  if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
