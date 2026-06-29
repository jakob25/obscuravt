import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { parseBody, voteSchema } from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { MIN_VOTES, HOUSE_CUT } from '@/lib/db-constants'
import { createNotification } from '@/lib/notifications'

async function resolveBet(betId: string) {
  const { data: bet } = await supabaseAdmin.from('bets').select('*').eq('id', betId).single()
  if (!bet || !['voting', 'open'].includes(bet.status)) return false

  const { data: votes } = await supabaseAdmin.from('votes').select('*').eq('bet_id', betId)
  const { data: entries } = await supabaseAdmin.from('bet_entries').select('*').eq('bet_id', betId)

  if (!votes?.length) return false

  const counts: Record<string, number> = {}
  for (const v of votes) counts[v.option] = (counts[v.option] ?? 0) + 1
  const totalVotes = votes.length
  const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]

  if (counts[winner] <= totalVotes / 2 && totalVotes < MIN_VOTES) return false

  const pot = (entries ?? []).reduce((s: number, e: { amount: number }) => s + e.amount, 0)
  const distributable = Math.floor(pot * (1 - HOUSE_CUT))
  const winnerEntries = (entries ?? []).filter((e: { option: string }) => e.option === winner)
  const winnerStake = winnerEntries.reduce((s: number, e: { amount: number }) => s + e.amount, 0)

  for (const e of winnerEntries) {
    const share = winnerStake > 0 ? Math.floor(distributable * (e.amount / winnerStake)) : 0
    const { data: user } = await supabaseAdmin.from('users').select('*').eq('username', e.username).single()
    if (user) {
      await supabaseAdmin.from('users').update({
        coins: user.coins + share,
        total_won: (user.total_won ?? 0) + share,
        biggest_win: Math.max(user.biggest_win ?? 0, share),
        bets_correct: (user.bets_correct ?? 0) + 1,
      }).eq('username', e.username)
      // Notify winners
      await createNotification(
        e.username,
        'Bet won',
        `"${bet.title}" resolved. You wagered on "${winner}" and won ${share.toLocaleString()} Vault Scraps.`,
        'bet_won',
        betId,
      )
    }
  }

  for (const e of (entries ?? []).filter((e: { option: string }) => e.option !== winner)) {
    const { data: user } = await supabaseAdmin.from('users').select('*').eq('username', e.username).single()
    if (user) {
      await supabaseAdmin.from('users').update({
        total_lost: (user.total_lost ?? 0) + e.amount,
        biggest_loss: Math.max(user.biggest_loss ?? 0, e.amount),
      }).eq('username', e.username)
      // Notify losers
      await createNotification(
        e.username,
        'Bet resolved',
        `"${bet.title}" resolved. The winner was "${winner}". Better luck next time!`,
        'bet_lost',
        betId,
      )
    }
  }

  await supabaseAdmin.from('bets').update({ status: 'resolved', result: winner }).eq('id', betId)

  // Check and award achievements
  await checkAchievements(winnerEntries.map((e: { username: string }) => e.username))

  return true
}

async function checkAchievements(usernames: string[]) {
  for (const username of usernames) {
    const { data: user } = await supabaseAdmin
      .from('users').select('coins, bets_correct').eq('username', username).single()
    if (!user) continue

    const { data: existing } = await supabaseAdmin
      .from('user_badges').select('achievement_id').eq('username', username)
    const earned = new Set((existing ?? []).map((b: { achievement_id: string }) => b.achievement_id))

    const toAward: { id: string; coins: number; name: string }[] = []

    if (!earned.has('high_roller') && (user.coins ?? 0) >= 10000)
      toAward.push({ id: 'high_roller', coins: 2000, name: 'High Roller' })

    for (const { id, coins, name } of toAward) {
      await supabaseAdmin.from('user_badges').insert({
        id: randomUUID(), username, achievement_id: id,
        earned_at: new Date().toISOString(),
      })
      await supabaseAdmin.from('users').update({ coins: (user.coins ?? 0) + coins }).eq('username', username)
      await createNotification(username, `Achievement unlocked: ${name}`, `You earned the ${name} badge and ${coins.toLocaleString()} Vault Scraps.`, 'achievement', id)
    }
  }
}

export async function POST(req: NextRequest) {
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const parsed = await parseBody(req, voteSchema)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const { bet_id, option } = parsed.data
  const username = session.username

  if (!bet_id || !username || !option)
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

  const { data: existing } = await supabaseAdmin
    .from('votes').select('id').eq('bet_id', bet_id).eq('username', username).single()

  if (existing)
    return NextResponse.json({ error: 'Already voted on this bet.' }, { status: 409 })

  // Increment deciding_votes counter for voter
  const { data: voter } = await supabaseAdmin.from('users').select('deciding_votes').eq('username', username).single()
  if (voter) {
    await supabaseAdmin.from('users').update({ deciding_votes: (voter.deciding_votes ?? 0) + 1 }).eq('username', username)
  }

  const { count: priorVotes } = await supabaseAdmin
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('bet_id', bet_id)

  await supabaseAdmin.from('votes').insert({
    id: randomUUID(), bet_id, username, option,
    created_at: new Date().toISOString(),
  })

  if ((priorVotes ?? 0) === 0) {
    await supabaseAdmin.from('bets').update({ status: 'voting' }).eq('id', bet_id).eq('status', 'open')
    const { data: bet } = await supabaseAdmin.from('bets').select('title').eq('id', bet_id).single()
    const { data: entries } = await supabaseAdmin.from('bet_entries').select('username').eq('bet_id', bet_id)
    for (const e of entries ?? []) {
      await createNotification(
        e.username,
        'Bet entering voting phase',
        `"${bet?.title ?? 'Your bet'}" is now open for outcome votes. Cast your vote to help resolve it.`,
        'bet_voting',
        bet_id,
      )
    }
  }

  const resolved = await resolveBet(bet_id)
  return NextResponse.json({ ok: true, resolved })
}
