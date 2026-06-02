import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store — resets on cold start, good enough for Vercel serverless
// For production scale, replace with Upstash Redis
const store = new Map<string, RateLimitEntry>()

// Clean up stale entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    store.forEach((entry, key) => {
      if (entry.resetAt < now) store.delete(key)
    })
  }, 60_000)
}

export interface RateLimitConfig {
  limit: number        // max requests
  window: number       // window in seconds
  identifier?: string  // custom key suffix
}

export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{ ok: boolean; response?: NextResponse }> {
  const { limit, window: windowSecs, identifier = '' } = config

  // Key: IP + route + optional identifier
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  const route = new URL(req.url).pathname
  const key = `${ip}:${route}:${identifier}`

  const now = Date.now()
  const windowMs = windowSecs * 1000
  const resetAt = now + windowMs

  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt })
    return { ok: true }
  }

  entry.count++

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    const res = NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter}s.` },
      { status: 429 }
    )
    res.headers.set('Retry-After', String(retryAfter))
    res.headers.set('X-RateLimit-Limit', String(limit))
    res.headers.set('X-RateLimit-Remaining', '0')
    return { ok: false, response: res }
  }

  return { ok: true }
}

// Pre-configured rate limiters for common routes
export const rateLimits = {
  // Auth — tight: 10 attempts per 15 minutes per IP
  auth: (req: NextRequest) => rateLimit(req, { limit: 10, window: 900 }),

  // Write actions — 30 per minute
  write: (req: NextRequest) => rateLimit(req, { limit: 30, window: 60 }),

  // Read — 200 per minute
  read: (req: NextRequest) => rateLimit(req, { limit: 200, window: 60 }),

  // Scraps transactions — 20 per minute (prevents drain attacks)
  transaction: (req: NextRequest) => rateLimit(req, { limit: 20, window: 60 }),
}
