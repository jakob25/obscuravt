import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { supabaseAdmin } = await import('@/lib/supabase')

  const { data, error } = await supabaseAdmin
    .from('clips')
    .select('id,title,clip_url,profile_id,submitter,upvotes,created_at,tags,description')
    .eq('submitter', session.username)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const clips = data ?? []
  const totalUpvotes = clips.reduce((s, c) => s + (c.upvotes ?? 0), 0)

  return NextResponse.json({
    clips,
    stats: {
      total_clips: clips.length,
      total_upvotes: totalUpvotes,
      avg_upvotes: clips.length ? Math.round(totalUpvotes / clips.length) : 0,
    },
  })
}