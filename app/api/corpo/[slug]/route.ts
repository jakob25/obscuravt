import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { slug } = await context.params
  const body = await req.json()
  const { bio, banner_url, memberVtuberIds } = body

  const { supabaseAdmin } = await import('@/lib/supabase')

  const { data: group } = await supabaseAdmin
    .from('corpo_groups')
    .select('created_by')
    .eq('slug', slug)
    .single()

  if (!group) return NextResponse.json({ error: 'Group not found.' }, { status: 404 })
  if (group.created_by !== session.username) {
    return NextResponse.json({ error: 'Only the group creator can edit.' }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}
  if (bio !== undefined) updates.bio = String(bio).trim()
  if (banner_url !== undefined) updates.banner_url = banner_url?.trim() || null
  if (memberVtuberIds !== undefined) {
    updates.member_vtuber_ids = Array.isArray(memberVtuberIds) ? memberVtuberIds : []
  }

  const { error } = await supabaseAdmin
    .from('corpo_groups')
    .update(updates)
    .eq('slug', slug)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}