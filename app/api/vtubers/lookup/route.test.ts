import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { VTUBER_SUBMIT } from '@/lib/site-copy'

const requireAuth = vi.fn()
const lookupLimit = vi.fn(async (_req?: NextRequest): Promise<{ ok: true } | { ok: false; response: NextResponse }> => ({ ok: true }))
const lookupVtuberProfile = vi.fn()
const matchCreator = vi.fn()
const creatorKeys = vi.fn((row: { handle: string | null; link: string | null }) => {
  const keys = []
  if (row.handle) keys.push(row.handle.toLowerCase())
  return keys
})

vi.mock('@/lib/session', () => ({
  requireAuth: (req: NextRequest) => requireAuth(req),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimits: { lookup: (req: NextRequest) => lookupLimit(req) },
}))

vi.mock('@/lib/vtuber-profile-lookup', () => ({
  lookupVtuberProfile: (...args: unknown[]) => lookupVtuberProfile(...args),
}))

vi.mock('@/lib/creator-match', () => ({
  matchCreator: (...args: unknown[]) => matchCreator(...args),
  creatorKeys: (...args: unknown[]) => creatorKeys(...args as [never]),
}))

function postUrl(url?: unknown) {
  return new NextRequest('http://localhost/api/vtubers/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(url === undefined ? {} : { url }),
  })
}

describe('POST /api/vtubers/lookup', () => {
  beforeEach(() => {
    requireAuth.mockReset()
    lookupLimit.mockReset()
    lookupLimit.mockResolvedValue({ ok: true as const })
    lookupVtuberProfile.mockReset()
    matchCreator.mockReset()
    creatorKeys.mockClear()
    requireAuth.mockResolvedValue({ username: 'Nim', role: 'user', iat: 1, exp: 2 })
    matchCreator.mockResolvedValue({ status: 'none' })
  })

  it('rejects a signed-out lookup', async () => {
    requireAuth.mockResolvedValue(
      NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
    )
    const { POST } = await import('./route')
    const res = await POST(postUrl('https://www.twitch.tv/pipuru'))
    expect(res.status).toBe(401)
    expect(lookupVtuberProfile).not.toHaveBeenCalled()
  })

  it('returns the rate-limit response when the cap is hit', async () => {
    lookupLimit.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Too many requests. Try again in 30s.' }, { status: 429 }),
    })
    const { POST } = await import('./route')
    const res = await POST(postUrl('https://www.twitch.tv/pipuru'))
    expect(res.status).toBe(429)
    expect(lookupVtuberProfile).not.toHaveBeenCalled()
  })

  it('returns 400 when the helper rejects the URL', async () => {
    lookupVtuberProfile.mockResolvedValue({ error: VTUBER_SUBMIT.pasteLink, status: 400 })
    const { POST } = await import('./route')
    const res = await POST(postUrl('https://kick.com/nope'))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe(VTUBER_SUBMIT.pasteLink)
  })

  it('returns the lookup and a duplicate match against existing creators', async () => {
    lookupVtuberProfile.mockResolvedValue({
      platform: 'Twitch',
      link: 'https://www.twitch.tv/pipuru',
      name: 'Pipuru',
      handle: 'pipuru',
      bio: 'Hello',
      avatarUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/x.png',
      partial: false,
      message: null,
    })
    matchCreator.mockResolvedValue({
      status: 'pending',
      creator: { id: 'vt_pipuru', name: 'Pipuru' },
      via: 'pipuru',
    })
    const { POST } = await import('./route')
    const res = await POST(postUrl('https://www.twitch.tv/pipuru'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.name).toBe('Pipuru')
    expect(data.duplicate).toEqual({ status: 'pending', id: 'vt_pipuru', name: 'Pipuru' })
  })
})
