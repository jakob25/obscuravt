import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { worldInput } from '@/lib/worlds/schema'
import { supabaseAdmin } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session
  const { data, error } = await supabaseAdmin.from('corpo_groups').select('slug,name,bio,member_vtuber_ids,world_details').eq('kind', 'world').order('name')
  if (error) return NextResponse.json({ error: 'World management is unavailable. Check that the world migration has been applied.' }, { status: 503 })
  return NextResponse.json({ worlds: data ?? [] })
}
export async function POST(req: NextRequest) { return save(req, false) }
export async function PUT(req: NextRequest) { return save(req, true) }
async function save(req: NextRequest, editing: boolean) {
  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session
  let body: unknown
  try {
    const text = await req.text()
    if (new TextEncoder().encode(text).length > 256000) return NextResponse.json({error: 'World is too large.'}, {status: 413})
    body = JSON.parse(text)
  } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }
  const parsed = worldInput.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map(issue => issue.message).join(' ') }, { status: 400 })
  const world = parsed.data
  if (world.member_vtuber_ids.length) {
    const { data, error } = await supabaseAdmin.from('vtubers').select('id').in('id', world.member_vtuber_ids).eq('approved', true)
    if (error) return NextResponse.json({ error: 'Could not validate dossiers. Nothing saved.' }, { status: 503 })
    if (data?.length !== world.member_vtuber_ids.length) return NextResponse.json({ error: 'Choose existing approved dossiers only.' }, { status: 400 })
  }
  const result = editing
    ? await supabaseAdmin.from('corpo_groups').update(world).eq('slug', world.slug).eq('kind', 'world').select('slug').maybeSingle()
    : await supabaseAdmin.from('corpo_groups').insert({ ...world, kind: 'world', created_by: session.username }).select('slug').single()
  if (result.error) return NextResponse.json({ error: result.error.code === '23505' ? 'That URL name is already in use.' : 'World could not be saved. Nothing else was changed.' }, { status: result.error.code === '23505' ? 409 : 503 })
  if (!result.data) return NextResponse.json({ error: 'World not found.' }, { status: 404 })
  return NextResponse.json({ ok: true, slug: result.data.slug })
}

// Removes only the world row; dossiers, clips and accounts are never deleted.
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return NextResponse.json({error: 'Invalid world URL name.'}, {status: 400})
  const {data, error} = await supabaseAdmin.from('corpo_groups').delete().eq('slug', slug).eq('kind', 'world').select('slug').maybeSingle()
  if (error) return NextResponse.json({error: 'World could not be removed.'}, {status: 503})
  if (!data) return NextResponse.json({error: 'World not found.'}, {status: 404})
  return NextResponse.json({ok: true})
}
