import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let q = supabaseAdmin.from('bets').select('*').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: 'Failed to fetch bets.' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { vtuber_name, stream_link, game_or_activity, title, description, options, category, created_by } = body

  if (!title || !options?.length || !created_by)
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })

  // Duplicate check
  const { data: existing } = await supabaseAdmin
    .from('bets')
    .select('id,title,status')
    .eq('status', 'open')
    .ilike('vtuber_name', `%${vtuber_name?.trim() ?? ''}%`)

  const stopWords = new Set(['the','a','an','is','will','they','on','of','or','and','in','for','their','this','does'])
  const titleWords: Set<string> = new Set(title.toLowerCase().split(/\s+/).filter((w: string) => !stopWords.has(w)))

  const dupes = (existing ?? []).filter((b: { title: string }) => {
    const bWords: Set<string> = new Set(b.title.toLowerCase().split(/\s+/).filter((w: string) => !stopWords.has(w)))
    const overlap = [...titleWords].filter((w: string) => bWords.has(w))
    return overlap.length >= 3
  })

  if (dupes.length > 0)
    return NextResponse.json({ error: 'Similar bet already exists.', dupes }, { status: 409 })

  const { error } = await supabaseAdmin.from('bets').insert({
    id: randomUUID(),
    vtuber_name: vtuber_name?.trim() ?? '',
    stream_link: stream_link?.trim() ?? '',
    game_or_activity: game_or_activity?.trim() ?? '',
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
