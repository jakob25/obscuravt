import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const empty = { data: [] as any[] }

  const [
    clipsRes,
    fanArtRes,
    vtubersRes,
    postsRes,
    betsRes,
    vtuberCountRes,
    clipCountRes,
    userCountRes,
  ] = await Promise.all([
    supabaseAdmin
      .from('clips')
      .select('id,title,clip_url,profile_id,submitter,upvotes,created_at,vtuber_name')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(r => r)
      .catch(() => empty),

    supabaseAdmin
      .from('fan_art')
      .select('id,vtuber_id,submitted_by,twitter_url,image_url,created_at')
      .eq('reported', false)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(r => r)
      .catch(() => empty),

    supabaseAdmin
      .from('vtubers')
      .select('id,name,avatar_url,bio,created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(r => r)
      .catch(() => empty),

    supabaseAdmin
      .from('cluster_posts')
      .select('id,constellation_id,username,content,vtuber_id,upvotes,created_at')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(r => r)
      .catch(() => empty),

    supabaseAdmin
      .from('bets')
      .select('id,title,vtuber_name,status,created_at,options')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(r => r)
      .catch(() => empty),

    supabaseAdmin
      .from('vtubers')
      .select('id', { count: 'exact', head: true })
      .eq('approved', true)
      .then(r => r)
      .catch(() => ({ count: 0 })),

    supabaseAdmin
      .from('clips')
      .select('id', { count: 'exact', head: true })
      .then(r => r)
      .catch(() => ({ count: 0 })),

    supabaseAdmin
      .from('users')
      .select('username', { count: 'exact', head: true })
      .then(r => r)
      .catch(() => ({ count: 0 })),
  ])

  return NextResponse.json({
    clips: clipsRes.data ?? [],
    fanArt: fanArtRes.data ?? [],
    vtubers: vtubersRes.data ?? [],
    posts: postsRes.data ?? [],
    predictions: betsRes.data ?? [],
    stats: {
      vtuberCount: vtuberCountRes.count ?? 0,
      clipCount: clipCountRes.count ?? 0,
      userCount: userCountRes.count ?? 0,
    },
  })
}
