import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (!user)
    return NextResponse.json({ error: 'Username not found.' }, { status: 401 })

  if (!user.password_hash)
    return NextResponse.json({ error: 'Account has no password set. Contact support.' }, { status: 401 })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid)
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })

  return NextResponse.json({
    username: user.username,
    coins: user.coins,
    role: user.role,
  })
}
