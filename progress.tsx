import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { parseBody, betSchema } from '@/lib/validation'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const rl = await rateLimits.read(req)
  if (!rl.ok) return rl.response!

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let q = supabaseAdmin.from('bets').select('*').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: 'Failed to fetch bets.' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const rl = await rateLimits.write(req)
  if (!rl.ok) return rl.response!

  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const parsed = await parseBody(req, betSchema)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const { title, description, vtuber_name, category, options } = parsed.data
  const created_by = session.username

  const stopWords = new Set(['the','a','an','is','will','they','on','of','or','and','in','for','their','this','does'])
  const titleWords = new Set(title.toLowerCase().split(/\s+/).filter((w: string) => !stopWords.has(w)))

  const { data: existing } = await supabaseAdmin
    .from('bets').select('id,title').eq('status', 'open').ilike('vtuber_name', `%${vtuber_name?.trim() ?? ''}%`)

  const dupes = (existing ?? []).filter((b: { title: string }) => {
    const bWords = new Set(b.title.toLowerCase().split(/\s+/).filter((w: string) => !stopWords.has(w)))
    const overlap = (Array.from(titleWords) as string[]).filter((w: string) => bWords.has(w))
    return overlap.length >= 3
  })
  if (dupes.length > 0)
    return NextResponse.json({ error: 'Similar bet already exists.' }, { status: 409 })

  const { error } = await supabaseAdmin.from('bets').insert({
    id: randomUUID(),
    vtuber_name: vtuber_name?.trim() ?? '',
    stream_link: '',
    game_or_activity: '',
    title: title.trim(),
    description: description?.trim() ?? '',
    options,
    status: 'open',
    created_at: new Date().toISOString(),
    created_by,
    category,
    result: null,
  })

  if (error) return NextResponse.json({ error: 'Failed to create bet.' }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
