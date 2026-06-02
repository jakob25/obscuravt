import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const rl = await rateLimits.transaction(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { goal_id, amount } = await req.json()
  const username = session.username

  if (!goal_id || !username || !amount || amount < 1)
    return NextResponse.json({ error: 'Missing or invalid fields.' }, { status: 400 })

  const { data: goal } = await supabaseAdmin.from('cmdmi_goals').select('*').eq('id', goal_id).single()
  if (!goal) return NextResponse.json({ error: 'Goal not found.' }, { status: 404 })
  if (goal.status !== 'active') return NextResponse.json({ error: 'Goal is no longer active.' }, { status: 400 })

  const { data: user } = await supabaseAdmin.from('users').select('coins').eq('username', username).single()
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  if (user.coins < amount) return NextResponse.json({ error: `Insufficient scraps. You have ${user.coins.toLocaleString()}.` }, { status: 400 })

  // Deduct scraps
  await supabaseAdmin.from('users').update({ coins: user.coins - amount }).eq('username', username)

  // Record pledge
  await supabaseAdmin.from('cmdmi_pledges').insert({
    id: randomUUID(), goal_id, username, amount,
    pledged_at: new Date().toISOString(),
  })

  // Update funded amount
  const newFunded = goal.funded_amount + amount
  const nowFunded = newFunded >= goal.goal_amount

  await supabaseAdmin.from('cmdmi_goals').update({
    funded_amount: newFunded,
    status: nowFunded ? 'funded' : 'active',
    completed_at: nowFunded ? new Date().toISOString() : null,
  }).eq('id', goal_id)

  // If fully funded — notify creator and all pledgers
  if (nowFunded) {
    const { data: idea } = await supabaseAdmin
      .from('cmdmi_ideas').select('title,submitted_by').eq('id', goal.idea_id).single()

    const { data: pledgers } = await supabaseAdmin
      .from('cmdmi_pledges').select('username').eq('goal_id', goal_id)

    const allToNotify = [...new Set([
      goal.set_by,
      ...(pledgers ?? []).map((p: { username: string }) => p.username)
    ])]

    for (const u of allToNotify) {
      await supabaseAdmin.from('notifications').insert({
        id: randomUUID(),
        username: u,
        title: '🎯 Goal fully funded!',
        message: `"${idea?.title ?? 'A CMDMI goal'}" has been fully funded! The stream should happen soon.`,
        type: 'cmdmi_funded',
        related_id: goal_id,
        is_read: false,
        created_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ ok: true, funded: nowFunded, newFunded })
}
