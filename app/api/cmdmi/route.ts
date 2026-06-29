import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionUser } from '@/lib/session'
import { createNotification, notifyFavoriteVtubers } from '@/lib/notifications'
import { ownsVtuber } from '@/lib/owns-vtuber'

// ── GET: list ideas (optionally scoped to a vtuber profile) + their goal if one exists ─
export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get('profileId')

  let query = supabaseAdmin
    .from('cmdmi_ideas')
    .select('*')
    .order('upvotes', { ascending: false })

  if (profileId) query = query.eq('profile_id', profileId)

  const { data: ideas, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ideaIds = (ideas ?? []).map(i => i.id)
  const { data: goals } = await supabaseAdmin
    .from('cmdmi_goals')
    .select('*')
    .in('idea_id', ideaIds.length > 0 ? ideaIds : ['none'])

  const goalMap = Object.fromEntries((goals ?? []).map(g => [g.idea_id, g]))

  const enriched = (ideas ?? []).map(idea => ({
    ...idea,
    goal: goalMap[idea.id] ?? null,
  }))

  return NextResponse.json({ ideas: enriched })
}

// ── POST: submit a new idea ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { profileId, title, description } = await req.json()
  if (!profileId || !title) {
    return NextResponse.json({ error: 'profileId and title are required.' }, { status: 400 })
  }

  const ideaId = crypto.randomUUID()
  const { error } = await supabaseAdmin.from('cmdmi_ideas').insert({
    id: ideaId,
    profile_id: profileId,
    submitted_by: user.username,
    title,
    description: description ?? '',
    upvotes: 0,
    status: 'pending',
    created_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: vtuber } = await supabaseAdmin.from('vtubers').select('name').eq('id', profileId).single()
  await notifyFavoriteVtubers(
    profileId,
    vtuber?.name ?? 'a creator',
    'New stream idea',
    `${vtuber?.name ?? 'A creator'} has a new stream idea: "${title.trim()}"`,
    'cmdmi_new',
    ideaId,
    user.username,
  )

  return NextResponse.json({ ok: true })
}

// ── PATCH: upvote an idea, set a goal (creator only), or pledge scraps toward a goal ──
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const body = await req.json()
  const { action } = body

  // Fan upvotes an idea
  if (action === 'upvote') {
    const { ideaId } = body
    const { data: idea } = await supabaseAdmin.from('cmdmi_ideas').select('upvotes').eq('id', ideaId).single()
    if (!idea) return NextResponse.json({ error: 'Idea not found.' }, { status: 404 })
    await supabaseAdmin.from('cmdmi_ideas').update({ upvotes: (idea.upvotes ?? 0) + 1 }).eq('id', ideaId)
    return NextResponse.json({ ok: true })
  }

  // Creator selects an idea and sets a scraps goal
  if (action === 'set_goal') {
    const { ideaId, goalAmount } = body
    if (!ideaId || !goalAmount) {
      return NextResponse.json({ error: 'ideaId and goalAmount are required.' }, { status: 400 })
    }

    // Verify the requester actually owns this profile
    const { data: idea } = await supabaseAdmin.from('cmdmi_ideas').select('profile_id, submitted_by, title').eq('id', ideaId).single()
    if (!idea) return NextResponse.json({ error: 'Idea not found.' }, { status: 404 })

    if (!await ownsVtuber(user.username, idea.profile_id)) {
      return NextResponse.json({ error: 'You do not own this profile.' }, { status: 403 })
    }

    const { data: ownedVtuber } = await supabaseAdmin
      .from('vtubers')
      .select('id, name')
      .eq('id', idea.profile_id)
      .single()

    if (!ownedVtuber) return NextResponse.json({ error: 'VTuber profile not found.' }, { status: 404 })

    await supabaseAdmin.from('cmdmi_ideas').update({ status: 'selected' }).eq('id', ideaId)
    const goalId = crypto.randomUUID()
    await supabaseAdmin.from('cmdmi_goals').insert({
      id: goalId,
      idea_id: ideaId,
      profile_id: idea.profile_id,
      set_by: user.username,
      goal_amount: goalAmount,
      funded_amount: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      completed_at: null,
    })

    if (idea.submitted_by !== user.username) {
      await createNotification(
        idea.submitted_by,
        'Your idea was selected!',
        `"${idea.title}" was picked for Chat Made Me Do It. Goal: ${goalAmount.toLocaleString()} scraps.`,
        'cmdmi_selected',
        ideaId,
      )
    }

    await notifyFavoriteVtubers(
      idea.profile_id,
      ownedVtuber.name ?? 'a creator',
      'New Chat Made Me Do It goal',
      `${ownedVtuber.name ?? 'A creator'} set a ${goalAmount.toLocaleString()} scrap goal for "${idea.title}"`,
      'cmdmi_new',
      goalId,
      user.username,
    )

    return NextResponse.json({ ok: true })
  }

  // Fan pledges scraps toward an active goal
  if (action === 'pledge') {
    const { goalId, amount } = body
    if (!goalId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'goalId and a positive amount are required.' }, { status: 400 })
    }

    const { data: goal } = await supabaseAdmin.from('cmdmi_goals').select('*').eq('id', goalId).single()
    if (!goal || goal.status !== 'active') {
      return NextResponse.json({ error: 'Goal not found or no longer active.' }, { status: 404 })
    }

    const { data: pledger } = await supabaseAdmin.from('users').select('coins').eq('username', user.username).single()
    if (!pledger || (pledger.coins ?? 0) < amount) {
      return NextResponse.json({ error: 'Not enough scraps.' }, { status: 400 })
    }

    // Deduct from pledger, add to goal
    await supabaseAdmin.from('users').update({ coins: pledger.coins - amount }).eq('username', user.username)

    const newFunded = (goal.funded_amount ?? 0) + amount
    const goalMet = newFunded >= goal.goal_amount

    await supabaseAdmin.from('cmdmi_goals').update({
      funded_amount: newFunded,
      status: goalMet ? 'funded' : 'active',
      completed_at: goalMet ? new Date().toISOString() : null,
    }).eq('id', goalId)

    if (goalMet) {
      await supabaseAdmin.from('cmdmi_ideas').update({ status: 'completed' }).eq('id', goal.idea_id)

      const { data: idea } = await supabaseAdmin
        .from('cmdmi_ideas')
        .select('title, submitted_by')
        .eq('id', goal.idea_id)
        .single()

      if (idea) {
        const msg = `"${idea.title}" hit its ${goal.goal_amount.toLocaleString()} scrap goal — stream locked in!`
        await createNotification(idea.submitted_by, 'Chat Made Me Do It goal funded!', msg, 'cmdmi_funded', goalId)
        if (goal.set_by !== idea.submitted_by) {
          await createNotification(goal.set_by, 'Chat Made Me Do It goal funded!', msg, 'cmdmi_funded', goalId)
        }
      }
    }

    return NextResponse.json({ ok: true, funded_amount: newFunded, goal_met: goalMet })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
