import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionUser } from '@/lib/session'
import { ownsVtuber } from '@/lib/owns-vtuber'

export async function GET(req: NextRequest) {
  const vtuberId = req.nextUrl.searchParams.get('vtuberId')
  const sessionId = req.nextUrl.searchParams.get('sessionId')

  if (sessionId) {
    const { data: questions, error } = await supabaseAdmin
      .from('qa_questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ questions: [] })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ questions: questions ?? [] })
  }

  if (!vtuberId) return NextResponse.json({ error: 'vtuberId or sessionId required.' }, { status: 400 })

  const { data: sessions, error } = await supabaseAdmin
    .from('qa_sessions')
    .select('*')
    .eq('vtuber_id', vtuberId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ sessions: [] })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ sessions: sessions ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const body = await req.json()

  if (body.action === 'session') {
    const { vtuberId, title } = body
    if (!vtuberId || !title?.trim()) {
      return NextResponse.json({ error: 'vtuberId and title are required.' }, { status: 400 })
    }
    if (!await ownsVtuber(user.username, vtuberId)) {
      return NextResponse.json({ error: 'You do not own this profile.' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin.from('qa_sessions').insert({
      vtuber_id: vtuberId,
      title: title.trim(),
      status: 'open',
      created_by: user.username,
      created_at: new Date().toISOString(),
    }).select('id').single()

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'Q&A not available yet — run migration 002.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, sessionId: data?.id })
  }

  const { sessionId, question } = body
  if (!sessionId || !question?.trim()) {
    return NextResponse.json({ error: 'sessionId and question are required.' }, { status: 400 })
  }

  const { data: session } = await supabaseAdmin.from('qa_sessions').select('status').eq('id', sessionId).single()
  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
  if (session.status !== 'open') return NextResponse.json({ error: 'This Q&A session is closed.' }, { status: 400 })

  const { error } = await supabaseAdmin.from('qa_questions').insert({
    session_id: sessionId,
    asked_by: user.username,
    question: question.trim(),
    upvotes: 0,
    answered: false,
    created_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const body = await req.json()

  if (body.action === 'upvote') {
    const { questionId } = body
    if (!questionId) return NextResponse.json({ error: 'questionId required.' }, { status: 400 })
    const { data: q } = await supabaseAdmin.from('qa_questions').select('upvotes').eq('id', questionId).single()
    if (!q) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    await supabaseAdmin.from('qa_questions').update({ upvotes: (q.upvotes ?? 0) + 1 }).eq('id', questionId)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'answer') {
    const { questionId } = body
    if (!questionId) return NextResponse.json({ error: 'questionId required.' }, { status: 400 })
    const { data: q } = await supabaseAdmin
      .from('qa_questions')
      .select('session_id')
      .eq('id', questionId)
      .single()
    if (!q) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const { data: session } = await supabaseAdmin.from('qa_sessions').select('vtuber_id').eq('id', q.session_id).single()
    if (!session || !await ownsVtuber(user.username, session.vtuber_id)) {
      return NextResponse.json({ error: 'You do not own this profile.' }, { status: 403 })
    }
    await supabaseAdmin.from('qa_questions').update({ answered: true }).eq('id', questionId)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'close') {
    const { sessionId } = body
    if (!sessionId) return NextResponse.json({ error: 'sessionId required.' }, { status: 400 })
    const { data: session } = await supabaseAdmin.from('qa_sessions').select('vtuber_id').eq('id', sessionId).single()
    if (!session || !await ownsVtuber(user.username, session.vtuber_id)) {
      return NextResponse.json({ error: 'You do not own this profile.' }, { status: 403 })
    }
    await supabaseAdmin.from('qa_sessions').update({ status: 'closed' }).eq('id', sessionId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}