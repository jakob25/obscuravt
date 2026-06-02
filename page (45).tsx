import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signSession, setSessionCookie } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { parseBody, loginSchema } from '@/lib/validation'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  // Rate limit: 10 attempts per 15 min per IP
  const rl = await rateLimits.auth(req)
  if (!rl.ok) return rl.response!

  const parsed = await parseBody(req, loginSchema)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const { username, password } = parsed.data

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('username, password_hash, coins, role')
    .eq('username', username)
    .single()

  // Same error for both "not found" and "wrong password" — prevents username enumeration
  if (!user || !user.password_hash) {
    await new Promise(r => setTimeout(r, 200)) // timing attack mitigation
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
  }

  const token = await signSession(user.username, user.role)
  const res = NextResponse.json({ username: user.username, coins: user.coins, role: user.role })
  return setSessionCookie(res, token)
}
