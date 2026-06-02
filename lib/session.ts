import { SignJWT, jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'vtvault-dev-secret-change-in-production-min-32-chars'
)
const COOKIE_NAME = 'vtvault_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export interface SessionPayload {
  username: string
  role: string | null
  iat: number
  exp: number
}

// ── Sign a new session token ──────────────────────────────────────────────────
export async function signSession(username: string, role: string | null): Promise<string> {
  return new SignJWT({ username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET)
}

// ── Verify and decode a session token ────────────────────────────────────────
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

// ── Get session from request cookie ──────────────────────────────────────────
export async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

// ── Require auth — returns session or 401 response ───────────────────────────
export async function requireAuth(req: NextRequest): Promise<SessionPayload | NextResponse> {
  const session = await getSession(req)
  if (!session) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  return session
}

// ── Require admin role ────────────────────────────────────────────────────────
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES ?? 'jakob25,admin').split(',').map(s => s.trim())

export async function requireAdmin(req: NextRequest): Promise<SessionPayload | NextResponse> {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!ADMIN_USERNAMES.includes(session.username)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }
  return session
}

// ── Set session cookie on a response ─────────────────────────────────────────
export function setSessionCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
  return res
}

// ── Clear session cookie ──────────────────────────────────────────────────────
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return res
}

// ── /api/auth/me handler — called on app load to restore session ──────────────
export async function getSessionUser(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return null

  // Re-fetch fresh data from DB on session restore
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('username, coins, role')
    .eq('username', session.username)
    .single()

  return user ?? null
}
