import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const profile_id = req.nextUrl.searchParams.get('profile_id')
  const status = req.nextUrl.searchParams.get('status')

  let q = supabaseAdmin.from('cmdmi_ideas').select('*').order('upvotes', { ascending: false })
  if (profile_id) q = q.eq('profile_id', profile_id)
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: 'Failed to fetch.' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { profile_id, submitted_by, title, description } = await req.json()

  if (!profile_id || !submitted_by || !title?.trim())
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('cmdmi_ideas').insert({
    id: randomUUID(),
    profile_id,
    submitted_by,
    title: title.trim(),
    description: description?.trim() ?? '',
    upvotes: 0,
    status: 'pending',
    created_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to submit idea.' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { idea_id, action, username, goal_amount } = await req.json()

  if (!idea_id || !action) return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })

  // Upvote idea
  if (action === 'upvote') {
    const { data: existing } = await supabaseAdmin
      .from('cmdmi_idea_votes').select('id').eq('idea_id', idea_id).eq('username', username).single()
    if (existing) return NextResponse.json({ error: 'Already voted.' }, { status: 409 })

    const { data: idea } = await supabaseAdmin.from('cmdmi_ideas').select('upvotes').eq('id', idea_id).single()
    if (!idea) return NextResponse.json({ error: 'Idea not found.' }, { status: 404 })

    await supabaseAdmin.from('cmdmi_ideas').update({ upvotes: idea.upvotes + 1 }).eq('id', idea_id)
    await supabaseAdmin.from('cmdmi_idea_votes').insert({ id: randomUUID(), idea_id, username, voted_at: new Date().toISOString() })
    return NextResponse.json({ ok: true })
  }

  // Creator selects idea and sets goal
  if (action === 'select') {
    if (!goal_amount || !username) return NextResponse.json({ error: 'Missing goal_amount or username.' }, { status: 400 })

    const { data: idea } = await supabaseAdmin.from('cmdmi_ideas').select('profile_id').eq('id', idea_id).single()
    if (!idea) return NextResponse.json({ error: 'Idea not found.' }, { status: 404 })

    await supabaseAdmin.from('cmdmi_ideas').update({ status: 'selected' }).eq('id', idea_id)

    const { data: goal } = await supabaseAdmin.from('cmdmi_goals').insert({
      id: randomUUID(),
      idea_id,
      profile_id: idea.profile_id,
      set_by: username,
      goal_amount,
      funded_amount: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      completed_at: null,
    }).select().single()

    // Notify idea submitter
    const { data: ideaFull } = await supabaseAdmin.from('cmdmi_ideas').select('submitted_by,title').eq('id', idea_id).single()
    if (ideaFull) {
      await supabaseAdmin.from('notifications').insert({
        id: randomUUID(),
        username: ideaFull.submitted_by,
        title: '🎉 Your idea was selected!',
        message: `Your idea "${ideaFull.title}" was selected by the VTuber and a scraps goal has been set!`,
        type: 'cmdmi_selected',
        related_id: goal?.id ?? idea_id,
        is_read: false,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ ok: true, goal })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
