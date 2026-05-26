import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { MIN_VOTES, HOUSE_CUT } from '@/lib/db-constants'

async function resolveBet(betId: string) {
  const { supabaseAdmin } = await import('@/lib/supabase')

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
  const winners = (entries ?? []).filter((e: { option: string }) => e.option === winner)
  const winnerStake = winners.reduce((s: number, e: { amount: number }) => s + e.amount, 0)

  for (const e of winners) {
    const share = winnerStake > 0 ? Math.floor(distributable * e.amount / winnerStake) : 0
    const { data: user } = await supabaseAdmin.from('users').select('*').eq('username', e.username).single()
    if (user) {
      await supabaseAdmin.from('users').update({
        coins: user.coins + share,
        total_won: (user.total_won ?? 0) + share,
        biggest_win: Math.max(user.biggest_win ?? 0, share),
        bets_correct: (user.bets_correct ?? 0) + 1,
      }).eq('username', e.username)
    }
  }

  for (const e of (entries ?? []).filter((e: { option: string }) => e.option !== winner)) {
    const { data: user } = await supabaseAdmin.from('users').select('*').eq('username', e.username).single()
    if (user) {
      await supabaseAdmin.from('users').update({
        total_lost: (user.total_lost ?? 0) + e.amount,
        biggest_loss: Math.max(user.biggest_loss ?? 0, e.amount),
      }).eq('username', e.username)
    }
  }

  await supabaseAdmin.from('bets').update({ status: 'closed', result: winner }).eq('id', betId)
  return true
}

export async function POST(req: NextRequest) {
  const { supabaseAdmin } = await import('@/lib/supabase')

  const { bet_id, username, option } = await req.json()

  if (!bet_id || !username || !option)
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

  // Check existing vote
  const { data: existing } = await supabaseAdmin
    .from('votes')
    .select('id')
    .eq('bet_id', bet_id)
    .eq('username', username)
    .single()

  if (existing)
    return NextResponse.json({ error: 'Already voted on this bet.' }, { status: 409 })

  // Cast vote
  await supabaseAdmin.from('votes').insert({
    id: randomUUID(),
    bet_id,
    username,
    option,
    created_at: new Date().toISOString(),
  })

  // Try auto-resolve
  const resolved = await resolveBet(bet_id)

  return NextResponse.json({ ok: true, resolved })
}
