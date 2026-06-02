import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signSession, setSessionCookie } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { parseBody, registerSchema } from '@/lib/validation'
import { STARTING_COINS } from '@/lib/db-constants'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const rl = await rateLimits.auth(req)
  if (!rl.ok) return rl.response!

  const parsed = await parseBody(req, registerSchema)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const { username, password } = parsed.data

  const { data: existing } = await supabaseAdmin
    .from('users').select('username').eq('username', username).single()

  if (existing)
    return NextResponse.json({ error: 'Username already taken.' }, { status: 409 })

  const password_hash = await bcrypt.hash(password, 12) // increased from 10

  const { error } = await supabaseAdmin.from('users').insert({
    username,
    password_hash,
    coins: STARTING_COINS,
    joined_at: new Date().toISOString(),
    last_bonus: null,
    total_won: 0, total_lost: 0, biggest_win: 0, biggest_loss: 0,
    bets_correct: 0, bets_placed: 0, deciding_votes: 0,
    role: null, bio: '', favorite_vtubers: '',
  })

  if (error) return NextResponse.json({ error: 'Registration failed.' }, { status: 500 })

  const token = await signSession(username, null)
  const res = NextResponse.json({ ok: true }, { status: 201 })
  return setSessionCookie(res, token)
}
