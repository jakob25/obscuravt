import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'Username required.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('username', username)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Failed to fetch.' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const { notification_id } = await req.json()
  const username = session.username

  const query = notification_id
    ? supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', notification_id).eq('username', username)
    : supabaseAdmin.from('notifications').update({ is_read: true }).eq('username', username)

  const { error } = await query
  if (error) return NextResponse.json({ error: 'Failed to mark read.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Helper used internally by other API routes
export async function createNotification(
  username: string,
  title: string,
  message: string,
  type: string,
  related_id?: string
) {
  await supabaseAdmin.from('notifications').insert({
    id: randomUUID(),
    username,
    title,
    message,
    type,
    related_id: related_id ?? null,
    is_read: false,
    created_at: new Date().toISOString(),
  })
}
