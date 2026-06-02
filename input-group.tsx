import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')

  // Get VTubers that need tag validation (pick random ones user hasn't voted on)
  const { data: vtubers } = await supabaseAdmin
    .from('vtubers')
    .select('id,name,bio,tags')
    .eq('approved', true)
    .limit(50)

  if (!vtubers?.length) return NextResponse.json([])

  if (username) {
    // Filter out ones user already voted on
    const { data: voted } = await supabaseAdmin
      .from('vtuber_tag_votes')
      .select('profile_id')
      .eq('username', username)
    const votedIds = new Set((voted ?? []).map((v: { profile_id: string }) => v.profile_id))
    const unvoted = vtubers.filter(v => !votedIds.has(v.id))
    // Shuffle and return up to 10
    return NextResponse.json(unvoted.sort(() => Math.random() - 0.5).slice(0, 10))
  }

  return NextResponse.json(vtubers.sort(() => Math.random() - 0.5).slice(0, 10))
}

export async function POST(req: NextRequest) {
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { profile_id, tag_id, action } = await req.json()
  const username = session.username
  // action: 'confirm' | 'challenge'

  if (!profile_id || !username || !action)
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

  // Check session/streak
  let { data: tagSession } = await supabaseAdmin
    .from('tag_sessions').select('*').eq('username', username).single()

  if (!tagSession) {
    await supabaseAdmin.from('tag_sessions').insert({
      id: randomUUID(), username, streak: 0, last_tagged_at: null, total_tagged: 0
    })
    const { data: s } = await supabaseAdmin.from('tag_sessions').select('*').eq('username', username).single()
    tagSession = s
  }

  // Record vote
  try {
    await supabaseAdmin.from('vtuber_tag_votes').insert({
      id: randomUUID(), profile_id, username, voted_at: new Date().toISOString()
    })
  } catch (_) { /* ignore duplicate votes */ }

  // Update streak
  const newStreak = (tagSession?.streak ?? 0) + 1
  const newTotal = (tagSession?.total_tagged ?? 0) + 1
  await supabaseAdmin.from('tag_sessions').update({
    streak: newStreak,
    total_tagged: newTotal,
    last_tagged_at: new Date().toISOString()
  }).eq('username', username)

  // Award scraps every 10 tags
  let scrapsAwarded = 0
  if (newTotal % 10 === 0) {
    scrapsAwarded = 25
    const { data: user } = await supabaseAdmin.from('users').select('coins').eq('username', username).single()
    if (user) {
      await supabaseAdmin.from('users').update({ coins: user.coins + scrapsAwarded }).eq('username', username)
      await supabaseAdmin.from('notifications').insert({
        id: randomUUID(), username,
        title: '🏷️ Tag Streak Reward!',
        message: `You've validated ${newTotal} tags! Here's ${scrapsAwarded} Vault Scraps as a thank you.`,
        type: 'tag_reward', related_id: null, is_read: false,
        created_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ ok: true, streak: newStreak, total: newTotal, scrapsAwarded })
}
