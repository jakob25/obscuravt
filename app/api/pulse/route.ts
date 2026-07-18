import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function safeQuery<T>(fn: () => PromiseLike<{ data: T | null; error?: any }>, fallback: T): Promise<T> {
  try {
    const res = await fn()
    return (res.data ?? fallback) as T
  } catch {
    return fallback
  }
}

export async function GET() {
  const [
    clips,
    fanArt,
    vtubers,
    posts,
    predictions,
    vtuberCount,
    clipCount,
    userCount,
  ] = await Promise.all([
    safeQuery(
      () =>
        supabaseAdmin
          .from('clips')
          .select('id,title,clip_url,profile_id,submitter,upvotes,created_at,vtuber_name')
          .order('created_at', { ascending: false })
          .limit(8),
      [] as any[]
    ),
    safeQuery(
      () =>
        supabaseAdmin
          .from('fan_art')
          .select('id,vtuber_id,submitted_by,twitter_url,image_url,created_at')
          .eq('reported', false)
          .order('created_at', { ascending: false })
          .limit(8),
      [] as any[]
    ),
    safeQuery(
      () =>
        supabaseAdmin
          .from('vtubers')
          .select('id,name,avatar_url,bio,created_at')
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .limit(6),
      [] as any[]
    ),
    safeQuery(
      () =>
        supabaseAdmin
          .from('cluster_posts')
          .select('id,constellation_id,username,content,vtuber_id,upvotes,created_at')
          .order('created_at', { ascending: false })
          .limit(6),
      [] as any[]
    ),
    safeQuery(
      () =>
        supabaseAdmin
          .from('bets')
          .select('id,title,vtuber_name,status,created_at,options')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(6),
      [] as any[]
    ),
    safeQuery(
      async () => {
        const res = await supabaseAdmin
          .from('vtubers')
          .select('id', { count: 'exact', head: true })
          .eq('approved', true)
        return { data: res.count ?? 0 }
      },
      0
    ),
    safeQuery(
      async () => {
        const res = await supabaseAdmin.from('clips').select('id', { count: 'exact', head: true })
        return { data: res.count ?? 0 }
      },
      0
    ),
    safeQuery(
      async () => {
        const res = await supabaseAdmin.from('users').select('username', { count: 'exact', head: true })
        return { data: res.count ?? 0 }
      },
      0
    ),
  ])

  return NextResponse.json({
    clips,
    fanArt,
    vtubers,
    posts,
    predictions,
    stats: {
      vtuberCount,
      clipCount,
      userCount,
    },
  })
}
