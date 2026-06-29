import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getSessionUser } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { supabaseAdmin } = await import('@/lib/supabase')
  const slug = req.nextUrl.searchParams.get('slug')

  if (slug) {
    const { data } = await supabaseAdmin.from('corpo_groups').select('slug,name,bio,banner_url,member_vtuber_ids,created_by').eq('slug', slug).single()
    if (!data) return NextResponse.json({ error: 'Group not found.' }, { status: 404 })
    const { data: members } = await supabaseAdmin.from('vtubers').select('id,name,avatar_url,bio,link').in('id', data.member_vtuber_ids ?? [])
    return NextResponse.json({ group: data, members: members ?? [] })
  }

  const { data } = await supabaseAdmin.from('corpo_groups').select('slug,name,bio').order('created_at', { ascending: false }).limit(20)
  return NextResponse.json({ groups: data ?? [] })
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { name, slug, bio, memberVtuberIds } = await req.json()
  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'name and slug are required.' }, { status: 400 })
  }

  const { supabaseAdmin } = await import('@/lib/supabase')
  const { error } = await supabaseAdmin.from('corpo_groups').insert({
    name: name.trim(),
    slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    bio: bio?.trim() ?? '',
    member_vtuber_ids: memberVtuberIds ?? [],
    created_by: session.username,
    created_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}