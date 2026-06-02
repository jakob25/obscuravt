import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const rl = await rateLimits.read(req)
  if (!rl.ok) return rl.response!

  const category = req.nextUrl.searchParams.get('category')
  let q = supabaseAdmin
    .from('canonical_tags')
    .select('*')
    .order('category')
    .order('sort_order')

  if (category) q = q.eq('category', category)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: 'Failed to fetch tags.' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session

  const body = await req.json()
  const { id, tag, category, color, position_x, position_y, description, content_tag_ids } = body

  if (!id?.trim() || !tag?.trim() || !category?.trim())
    return NextResponse.json({ error: 'id, tag, and category are required.' }, { status: 400 })

  // Enforce ID conventions
  const validPrefixes = ['clust_', 'nclust_', 'vibe_', 'cont_']
  if (!validPrefixes.some(p => id.startsWith(p)))
    return NextResponse.json({
      error: `Tag ID must start with one of: ${validPrefixes.join(', ')}`
    }, { status: 400 })

  const { error } = await supabaseAdmin.from('canonical_tags').insert({
    id: id.trim().toLowerCase(),
    tag: tag.trim(),
    category: category.trim(),
    sort_order: body.sort_order ?? 99,
    color: color ?? null,
    position_x: position_x ?? null,
    position_y: position_y ?? null,
    description: description ?? null,
    content_tag_ids: content_tag_ids ?? null,
  })

  if (error?.code === '23505')
    return NextResponse.json({ error: 'A tag with this ID already exists.' }, { status: 409 })
  if (error)
    return NextResponse.json({ error: 'Failed to create tag.' }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })

  // Only allow updating safe fields
  const allowed = ['tag', 'color', 'position_x', 'position_y', 'description', 'content_tag_ids', 'sort_order']
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  )

  const { error } = await supabaseAdmin.from('canonical_tags').update(filtered).eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to update tag.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAdmin(req)
  if (session instanceof NextResponse) return session

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })

  // Safety check — don't delete cluster tags that have VTubers
  if (id.startsWith('clust_') || id.startsWith('nclust_')) {
    const { count } = await supabaseAdmin
      .from('vtubers')
      .select('id', { count: 'exact', head: true })
      .contains('tags', [id])

    if (count && count > 0)
      return NextResponse.json({
        error: `Cannot delete — ${count} VTuber(s) use this tag. Reassign them first.`
      }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('canonical_tags').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to delete tag.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
