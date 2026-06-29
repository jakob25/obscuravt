import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/session'
import { ownsVtuber } from '@/lib/owns-vtuber'
import { resolveAvatarUrl, resolveSilhouetteDisplay } from '@/lib/discovery-games'

const ADMINS = (process.env.ADMIN_USERNAMES ?? 'jakob25,admin').split(',').map(s => s.trim())

function mapRow(row: {
  id: string
  name: string
  bio: string | null
  tags: string[] | null
  avatar_url: string | null
  silhouette_url: string | null
}) {
  const tags = row.tags ?? []
  const cluster = tags.find(t => t.startsWith('clust_')) ?? 'clust_variety'
  const silhouette = resolveSilhouetteDisplay(row.id, row.silhouette_url, row.avatar_url)
  return {
    id: row.id,
    name: row.name,
    bio: row.bio ?? '',
    category: cluster,
    avatarUrl: resolveAvatarUrl(row.id, row.avatar_url),
    silhouetteUrl: row.silhouette_url,
    displayUrl: silhouette.url,
    source: silhouette.source,
  }
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('vtubers')
    .select('id, name, bio, tags, avatar_url, silhouette_url')
    .eq('approved', true)

  if (error) {
    if (error.code === '42703') {
      return NextResponse.json({ pool: [], migrationRequired: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data ?? []
  const uploaded = rows.filter(r => r.silhouette_url)
  const poolSource = uploaded.length >= 4 ? uploaded : rows.filter(r => r.avatar_url || r.silhouette_url)
  const pool = poolSource.map(mapRow)

  return NextResponse.json({
    pool,
    stats: {
      total: rows.length,
      withSilhouette: uploaded.length,
      preferUploaded: uploaded.length >= 4,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { vtuberId, silhouette_url } = await req.json()
  if (!vtuberId) {
    return NextResponse.json({ error: 'vtuberId is required.' }, { status: 400 })
  }

  const isAdmin = ADMINS.includes(session.username)
  if (!isAdmin && !await ownsVtuber(session.username, vtuberId)) {
    return NextResponse.json({ error: 'You do not manage this profile.' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('vtubers')
    .update({ silhouette_url: silhouette_url ?? null })
    .eq('id', vtuberId)

  if (error) {
    if (error.code === '42703') {
      return NextResponse.json({ error: 'Run migration 011-discovery-games.sql on Supabase.' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, vtuberId, silhouette_url: silhouette_url ?? null })
}