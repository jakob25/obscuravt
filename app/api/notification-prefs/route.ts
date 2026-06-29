import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'
import type { NotificationType } from '@/lib/notifications'

const DEFAULT_PREFS: Record<NotificationType, boolean> = {
  cmdmi_selected: true,
  cmdmi_funded: true,
  cmdmi_new: true,
  bet_voting: true,
  bet_won: true,
  bet_lost: true,
  achievement: true,
  qa_open: true,
  karaoke_open: true,
  schedule_vote: true,
  meme_new: true,
}

export async function GET(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('notification_prefs')
    .eq('username', session.username)
    .single()

  if (error) {
    if (error.code === '42703') return NextResponse.json({ prefs: DEFAULT_PREFS })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    prefs: { ...DEFAULT_PREFS, ...(user?.notification_prefs as Record<string, boolean> ?? {}) },
  })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const body = await req.json()
  const { type, enabled } = body as { type?: NotificationType; enabled?: boolean }
  if (!type || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'type and enabled are required.' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('notification_prefs')
    .eq('username', session.username)
    .single()

  const prefs = { ...DEFAULT_PREFS, ...(user?.notification_prefs as Record<string, boolean> ?? {}) }
  prefs[type] = enabled

  const { error } = await supabaseAdmin
    .from('users')
    .update({ notification_prefs: prefs })
    .eq('username', session.username)

  if (error) {
    if (error.code === '42703') {
      return NextResponse.json({ error: 'Run migration 009-notification-prefs.sql on Supabase.' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, prefs })
}