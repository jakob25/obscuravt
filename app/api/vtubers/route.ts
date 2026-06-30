import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const body = await req.json()
  const { name, handle, platform, link, bio, tags, avatar_url } = body
  const submitted_by = session.username

  if (!name?.trim())
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })

  // Duplicate check by name
  const { data: existing } = await supabaseAdmin
    .from('vtubers')
    .select('id, name')
    .ilike('name', name.trim())
    .single()

  if (existing)
    return NextResponse.json({ error: `${existing.name} is already in the Vault.` }, { status: 409 })

  // Also check by handle
  if (handle?.trim()) {
    const { data: byHandle } = await supabaseAdmin
      .from('vtubers')
      .select('id, name')
      .ilike('handle', handle.trim())
      .single()

    if (byHandle)
      return NextResponse.json({ error: `${byHandle.name} is already in the Vault (same handle).` }, { status: 409 })
  }

  const id = `vt_${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}_${randomUUID().slice(0, 6)}`

  const { error } = await supabaseAdmin.from('vtubers').insert({
    id,
    name: name.trim(),
    handle: handle?.trim() ?? '',
    platform: platform?.trim() ?? '',
    link: link?.trim() ?? '',
    bio: bio?.trim() ?? '',
    tags: tags ?? [],
    avatar_url: avatar_url ?? null,   // NEW: support uploaded avatar
    approved: false,
    nominated_by: submitted_by,
    spotlight: false,
  })

  if (error) return NextResponse.json({ error: 'Failed to submit VTuber.' }, { status: 500 })
  return NextResponse.json({ ok: true, id, pending: true }, { status: 201 })
}
