import { NextRequest, NextResponse } from 'next/server'
import { signSession, setSessionCookie } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimits } from '@/lib/rate-limit'
import * as bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const rl = await rateLimits.auth(req)
  if (!rl.ok) return rl.response!

  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('username, password_hash, coins, role, account_type')
    .eq('username', username)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const validPassword = await bcrypt.compare(password, user.password_hash)
  if (!validPassword) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const token = await signSession(user.username, user.role)
  const res = NextResponse.json({
    username: user.username,
    coins: user.coins,
    role: user.role,
    account_type: user.account_type,
  })

  setSessionCookie(res, token)
  return res
}
