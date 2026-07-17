import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function safeQuery<T>(fn: () => PromiseLike<{ data: T | null; error?: unknown }>, fallback: T): Promise<T> {
  try {
    const { data } = await fn()
    return data ?? fallback
  } catch {
    return fallback
  }
}

async function safeCount(fn: () => PromiseLike<{ count: number | null }>): Promise<number> {
  try {
    const { count } = await fn()
    return count ?? 0
  } catch {
    return 0
  }
}

export async function GET() {
  const [clips, fanArt, vtubers, posts, predictions, vtuberCount, clipCount, userCount] = await Promise.all([
    safeQuery(
      () =>
        supabaseAdmin
          .from('clips')
          .select('id,title,clip_url,profile_id,submitter,upvotes,created_at,vtuber_name')
          .order('created_at', { ascending: false })
          .limit(8),
      [] as any[],
    ),
    safeQuery(
      () =>
        supabaseAdmin
          .from('fan_art')
          .select('id,vtuber_id,submitted_by,twitter_url,image_url,created_at')
          .eq('reported', false)
          .order('created_at', { ascending: false })
          .limit(8),
      [] as any[],
    ),
    safeQuery(
      () =>
        supabaseAdmin
          .from('vtubers')
          .select('id,name,avatar_url,bio,created_at')
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .limit(6),
      [] as any[],
    ),
    safeQuery(
      () =>
        supabaseAdmin
          .from('cluster_posts')
          .select('id,constellation_id,username,content,vtuber_id,upvotes,created_at')
          .order('created_at', { ascending: false })
          .limit(6),
      [] as any[],
    ),
    safeQuery(
      () =>
        supabaseAdmin
          .from('bets')
          .select('id,title,vtuber_name,status,created_at,options')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(6),
      [] as any[],
    ),
    safeCount(() =>
      supabaseAdmin.from('vtubers').select('id', { count: 'exact', head: true }).eq('approved', true),
    ),
    safeCount(() => supabaseAdmin.from('clips').select('id', { count: 'exact', head: true })),
    safeCount(() => supabaseAdmin.from('users').select('username', { count: 'exact', head: true })),
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
