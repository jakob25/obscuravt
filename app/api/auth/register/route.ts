import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimits } from '@/lib/rate-limit'
import * as bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const rl = await rateLimits.auth(req)
  if (!rl.ok) return rl.response!

  const { username, password, account_type } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }

  const validTypes = ['vtuber', 'fan', 'clipper']
  if (!account_type || !validTypes.includes(account_type)) {
    return NextResponse.json({ error: 'Invalid account type.' }, { status: 400 })
  }

  // Check if user already exists
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('username')
    .eq('username', username)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Username already taken.' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 10)

  const { error } = await supabaseAdmin
    .from('users')
    .insert({
      username,
      password_hash,
      coins: 100,
      role: 'user',
      account_type,
    })

  if (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
