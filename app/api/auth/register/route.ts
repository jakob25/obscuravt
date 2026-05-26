import { NextRequest, NextResponse } from 'next/server'
import { STARTING_COINS } from '@/lib/db-constants'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { supabaseAdmin } = await import('@/lib/supabase')

  const { username, password } = await req.json()

  if (!username || !password)
    return NextResponse.json({ error: 'Username and password required.' }, { status: 400 })

  if (username.length < 3 || username.length > 20)
    return NextResponse.json({ error: 'Username must be 3–20 characters.' }, { status: 400 })

  if (password.length < 6)
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('username')
    .eq('username', username)
    .single()

  if (existing)
    return NextResponse.json({ error: 'Username already taken.' }, { status: 409 })

  const password_hash = await bcrypt.hash(password, 10)

  const { error } = await supabaseAdmin.from('users').insert({
    username,
    password_hash,
    coins: STARTING_COINS,
    joined_at: new Date().toISOString(),
    last_bonus: null,
    total_won: 0,
    total_lost: 0,
    biggest_win: 0,
    biggest_loss: 0,
    bets_correct: 0,
    bets_placed: 0,
    deciding_votes: 0,
    role: null,
    bio: '',
    favorite_vtubers: '',
  })

  if (error)
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 201 })
}
