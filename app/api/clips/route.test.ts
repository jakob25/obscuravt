import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getSession = vi.fn()
const allowSignedOutClipSubmit = vi.fn(() => false)
const writeLimit = vi.fn(async (_req?: NextRequest) => ({ ok: true as const }))
const rpc = vi.fn()
const clipsMaybeSingle = vi.fn()
const clipsLimit = vi.fn()
const clipsInsert = vi.fn()
const matchCreator = vi.fn(async (..._args: unknown[]) => ({ status: 'none' }))
const extractVideoId = vi.fn((_url?: string) => null)
const resolveClipThumbnail = vi.fn(async (_url?: string) => null)

vi.mock('@/lib/session', () => ({
  getSession: (req: NextRequest) => getSession(req),
}))

vi.mock('@/lib/flags', () => ({
  allowSignedOutClipSubmit: () => allowSignedOutClipSubmit(),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimits: { write: (req: NextRequest) => writeLimit(req) },
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table !== 'clips') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: clipsMaybeSingle,
          }),
          ilike: () => ({
            limit: clipsLimit,
          }),
        }),
        insert: clipsInsert,
      }
    },
    rpc,
  },
}))

vi.mock('@/lib/embed-utils', () => ({
  extractVideoId: (url: string) => extractVideoId(url),
  resolveClipThumbnail: (url: string) => resolveClipThumbnail(url),
}))

vi.mock('@/lib/twitch-helix', () => ({
  helixClipThumbnails: vi.fn(async () => ({})),
}))

vi.mock('@/lib/vtuber-channel-link', () => ({
  backfillMissingVtuberChannelLinks: vi.fn(async () => {}),
}))

vi.mock('@/lib/vtuber-twitch-hydrate', () => ({
  hydrateVtuberById: vi.fn(async () => {}),
}))

vi.mock('@/lib/creator-match', () => ({
  handleFromUrl: vi.fn(() => ''),
  matchCreator: (handles: string[]) => matchCreator(handles),
}))

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/clips', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  title: 'A fun clip',
  url: 'https://clips.twitch.tv/UniqueClipExample',
  vtuber_name: 'ExampleVTuber',
}

describe('POST /api/clips scrap awards', () => {
  beforeEach(() => {
    getSession.mockReset()
    allowSignedOutClipSubmit.mockReset()
    allowSignedOutClipSubmit.mockReturnValue(false)
    writeLimit.mockReset()
    writeLimit.mockResolvedValue({ ok: true })
    rpc.mockReset()
    clipsMaybeSingle.mockReset()
    clipsLimit.mockReset()
    clipsInsert.mockReset()
    matchCreator.mockReset()
    extractVideoId.mockReset()
    resolveClipThumbnail.mockReset()

    getSession.mockResolvedValue({ username: 'alice', role: 'Fan' })
    clipsMaybeSingle.mockResolvedValue({ data: null, error: null })
    clipsLimit.mockResolvedValue({ data: [], error: null })
    clipsInsert.mockResolvedValue({ error: null })
    matchCreator.mockResolvedValue({ status: 'none' })
    extractVideoId.mockReturnValue(null)
    resolveClipThumbnail.mockResolvedValue(null)
    rpc.mockResolvedValue({
      data: { awarded: 5, count_today: 3, capped: false, reset_at: '2026-11-11T08:00:00+00:00' },
      error: null,
    })
  })

  it('awards scraps after a successful post', async () => {
    const { POST } = await import('./route')
    const res = await POST(postRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(clipsInsert).toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledWith('award_clip_post_scraps', {
      p_username: 'alice',
      p_clip_id: expect.any(String),
    })
    expect(body.ok).toBe(true)
    expect(body.scrap_award).toEqual({
      awarded: 5,
      count_today: 3,
      daily_cap: 5,
      capped: false,
      reset_at: '2026-11-11T08:00:00+00:00',
    })
  })

  it('still posts the clip when the daily cap is hit', async () => {
    rpc.mockResolvedValue({
      data: { awarded: 0, count_today: 5, capped: true, reset_at: '2026-11-11T08:00:00+00:00' },
      error: null,
    })
    const { POST } = await import('./route')
    const res = await POST(postRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.ok).toBe(true)
    expect(body.scrap_award).toEqual({
      awarded: 0,
      count_today: 5,
      daily_cap: 5,
      capped: true,
      reset_at: '2026-11-11T08:00:00+00:00',
    })
  })

  it('does not award when the clip insert fails', async () => {
    clipsInsert.mockResolvedValue({
      error: { message: 'insert failed', code: 'XX000' },
    })
    const { POST } = await import('./route')
    const res = await POST(postRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to submit clip.')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('does not award a rejected duplicate post', async () => {
    clipsMaybeSingle.mockResolvedValue({ data: { id: 'existing' }, error: null })
    const { POST } = await import('./route')
    const res = await POST(postRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error).toBe('This clip is already in the archive.')
    expect(clipsInsert).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('still returns 201 if awarding throws after a successful insert', async () => {
    rpc.mockRejectedValue(new Error('rpc down'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { POST } = await import('./route')
    const res = await POST(postRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.ok).toBe(true)
    expect(body.scrap_award).toBeNull()
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('does not award guest posts', async () => {
    getSession.mockResolvedValue(null)
    allowSignedOutClipSubmit.mockReturnValue(true)
    const { POST } = await import('./route')
    const res = await POST(postRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.ok).toBe(true)
    expect(body.scrap_award).toBeNull()
    expect(rpc).not.toHaveBeenCalled()
  })
})
