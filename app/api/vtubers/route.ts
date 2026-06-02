import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET() {
  // DISCOVERABILITY POLICY:
  // A VTuber appears on the star map only when admin sets approved=true.
  // The creator's own discoverable toggle (in profiles table) hides from search/browse
  // but does NOT affect approved status.
  // Upvotes/endorsements are ONLY used for the weekly digest — never for filtering here.
  const { data, error } = await supabaseAdmin
    .from('vtubers')
    .select('*')
    .eq('approved', true)
    .order('name')

  if (error) return NextResponse.json({ error: 'Failed to fetch VTubers.' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const body = await req.json()
  const { name, handle, platform, link, bio, tags } = body
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
    approved: false, // pending review
    nominated_by: submitted_by,
    spotlight: false,
  })

  if (error) return NextResponse.json({ error: 'Failed to submit VTuber.' }, { status: 500 })
  return NextResponse.json({ ok: true, id, pending: true }, { status: 201 })
}
