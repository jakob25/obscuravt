import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireAuth } from '@/lib/session'

const STREAK_TARGET = 10
const STREAK_BONUS_SCRAPS = 100
const QUEUE_LIMIT = 50

function shuffle<T>(arr: T[]): T[] {
  const items = [...arr]
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

export async function GET(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { supabaseAdmin } = await import('@/lib/supabase')

  const [{ data: vtubers }, { data: canonicalTags }, { data: alreadyVoted }, { data: userRow }] = await Promise.all([
    supabaseAdmin.from('vtubers').select('id, name, bio, tags').eq('approved', true),
    supabaseAdmin
      .from('canonical_tags')
      .select('id, tag, category, color, description')
      .in('category', ['vibe', 'content', 'cluster']),
    supabaseAdmin
      .from('vtuber_tag_votes')
      .select('vtuber_id, tag')
      .eq('username', session.username),
    supabaseAdmin
      .from('users')
      .select('tag_validator_streak')
      .eq('username', session.username)
      .single(),
  ])

  if (!vtubers?.length || !canonicalTags?.length) {
    return NextResponse.json({ queue: [] })
  }

  const voted = new Set((alreadyVoted ?? []).map(r => `${r.vtuber_id}:${r.tag}`))

  const items: Array<{
    vtuber: { id: string; name: string; bio: string; tags: string[] }
    tag: { id: string; tag: string; category: string; color: string; description: string }
  }> = []

  for (const vtuber of vtubers) {
    for (const tag of canonicalTags) {
      const key = `${vtuber.id}:${tag.id}`
      if (!voted.has(key)) {
        items.push({
          vtuber: {
            id: vtuber.id,
            name: vtuber.name,
            bio: vtuber.bio ?? '',
            tags: vtuber.tags ?? [],
          },
          tag: {
            id: tag.id,
            tag: tag.tag,
            category: tag.category,
            color: tag.color ?? '#d4a574',
            description: tag.description ?? '',
          },
        })
      }
    }
  }

  return NextResponse.json({
    queue: shuffle(items).slice(0, QUEUE_LIMIT),
    streak: userRow?.tag_validator_streak ?? 0,
    streakTarget: STREAK_TARGET,
  })
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const body = await req.json()
  const { vtuberId, tagId, vote } = body as { vtuberId?: string; tagId?: string; vote?: number }

  if (!vtuberId || !tagId || vote === undefined) {
    return NextResponse.json({ error: 'vtuberId, tagId, and vote are required.' }, { status: 400 })
  }

  if (vote !== 1 && vote !== -1 && vote !== 0) {
    return NextResponse.json({ error: 'vote must be -1, 0, or 1.' }, { status: 400 })
  }

  const { supabaseAdmin } = await import('@/lib/supabase')

  if (vote === 0) {
    await supabaseAdmin
      .from('users')
      .update({ tag_validator_streak: 0 })
      .eq('username', session.username)
    return NextResponse.json({ ok: true, scrapsAwarded: 0, streak: 0, streakBonus: false })
  }

  const { data: tag } = await supabaseAdmin
    .from('canonical_tags')
    .select('id, category')
    .eq('id', tagId)
    .single()

  if (!tag) return NextResponse.json({ error: 'Tag not found.' }, { status: 404 })

  const { error: insertError } = await supabaseAdmin.from('vtuber_tag_votes').insert({
    id: randomUUID(),
    vtuber_id: vtuberId,
    tag: tagId,
    tag_type: tag.category,
    vote,
    profile_id: session.username,
    username: session.username,
    voted_at: new Date().toISOString(),
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Already voted on this tag.' }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('coins, tag_validator_streak')
    .eq('username', session.username)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  const nextStreak = (user.tag_validator_streak ?? 0) + 1
  let scrapsAwarded = 0
  let streakBonus = false
  let newStreak = nextStreak

  if (nextStreak >= STREAK_TARGET) {
    scrapsAwarded = STREAK_BONUS_SCRAPS
    streakBonus = true
    newStreak = 0
    await supabaseAdmin
      .from('users')
      .update({ coins: user.coins + STREAK_BONUS_SCRAPS, tag_validator_streak: 0 })
      .eq('username', session.username)
  } else {
    await supabaseAdmin
      .from('users')
      .update({ tag_validator_streak: nextStreak })
      .eq('username', session.username)
  }

  return NextResponse.json({ ok: true, scrapsAwarded, streak: newStreak, streakBonus, streakTarget: STREAK_TARGET })
}