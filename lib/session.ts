import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SignJWT, jwtVerify } from 'jose'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
)

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'jakob25,admin')
  .split(',')
  .map(name => name.trim())

export interface SessionPayload {
  username: string
  role: string | null
  iat: number
  exp: number
}

export interface UserSession {
  username: string
  coins: number
  role: string | null
  account_type: string | null
}

// Create JWT session token
export async function signSession(username: string, role: string | null = null): Promise<string> {
  return new SignJWT({ username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

// Verify JWT token
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as SessionPayload
  } catch {
    return null
  }
}

// Get session from cookie
export async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get('vtvault_session')?.value
  if (!token) return null
  return verifySession(token)
}

// Require authentication
export async function requireAuth(req: NextRequest): Promise<SessionPayload | NextResponse> {
  const session = await getSession(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}

// Require admin access
export async function requireAdmin(req: NextRequest): Promise<SessionPayload | NextResponse> {
  const session = await getSession(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!ADMIN_USERNAMES.includes(session.username)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session
}

// Get full user data from database
export async function getSessionUser(req: NextRequest): Promise<UserSession | null> {
  const session = await getSession(req)
  if (!session) return null

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('username, coins, role, account_type')
    .eq('username', session.username)
    .single()

  if (!user) return null

  return {
    username: user.username,
    coins: user.coins || 0,
    role: user.role,
    account_type: user.account_type,
  }
}

// Set session cookie
export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set('vtvault_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
}

// Clear session cookie
export function clearSessionCookie(res: NextResponse) {
  res.cookies.set('vtvault_session', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  })
}
