import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const requireAuth = vi.fn()
const writeLimit = vi.fn(async (_req?: NextRequest) => ({ ok: true as const }))
const isStoredVtuberAvatarUrl = vi.fn((url: string | null | undefined) =>
  typeof url === 'string' && url.includes('/storage/v1/object/public/vtuber-avatars/'),
)
const copyLookupAvatarToBucket = vi.fn()
const matchCreator = vi.fn()
const creatorKeys = vi.fn((_row?: { handle: string | null; link: string | null }) => ['pipuru'])
const handleFromUrl = vi.fn((_raw?: string | null) => '')

const vtuberSelect = vi.fn()
const vtuberInsert = vi.fn()
const clipsSelect = vi.fn()
const from = vi.fn((table: string) => {
  if (table === 'vtubers') {
    return {
      select: (...args: unknown[]) => vtuberSelect(...args),
      insert: (...args: unknown[]) => vtuberInsert(...args),
    }
  }
  if (table === 'clips') {
    return { select: (...args: unknown[]) => clipsSelect(...args) }
  }
  if (table === 'canonical_tags') {
    return {
      select: () => ({
        in: () => ({
          order: async () => ({
            data: [
              { id: 'nclust_darkroom', tag: 'The Darkroom', category: 'niche_cluster', sort_order: 1 },
              { id: 'nclust_cursed_asmr', tag: 'Cursed ASMR', category: 'niche_cluster', sort_order: 11 },
              { id: 'clust_chaos', tag: 'Chaos', category: 'cluster', sort_order: 1 },
            ],
            error: null,
          }),
        }),
      }),
    }
  }
  throw new Error(`unexpected table ${table}`)
})

vi.mock('@/lib/session', () => ({
  requireAuth: (req: NextRequest) => requireAuth(req),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimits: { write: (req: NextRequest) => writeLimit(req) },
}))

vi.mock('@/lib/vtuber-avatar-copy', () => ({
  isStoredVtuberAvatarUrl: (url: string | null | undefined) => isStoredVtuberAvatarUrl(url),
  copyLookupAvatarToBucket: (url: string, username: string) => copyLookupAvatarToBucket(url, username),
}))

vi.mock('@/lib/creator-match', () => ({
  matchCreator: (handles: string[]) => matchCreator(handles),
  creatorKeys: (row: { handle: string | null; link: string | null }) => creatorKeys(row),
  handleFromUrl: (raw: string | null | undefined) => handleFromUrl(raw),
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdminClient: () => ({ from }),
}))

function postBody(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/vtubers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/vtubers', () => {
  beforeEach(() => {
    requireAuth.mockReset()
    writeLimit.mockClear()
    isStoredVtuberAvatarUrl.mockClear()
    copyLookupAvatarToBucket.mockReset()
    matchCreator.mockReset()
    creatorKeys.mockClear()
    vtuberSelect.mockReset()
    vtuberInsert.mockReset()
    clipsSelect.mockReset()
    from.mockClear()
    requireAuth.mockResolvedValue({ username: 'Nim', role: 'user', iat: 1, exp: 2 })
    matchCreator.mockResolvedValue({ status: 'none' })
    vtuberSelect.mockReturnValue({
      ilike: () => ({
        single: async () => ({ data: null }),
      }),
    })
    vtuberInsert.mockResolvedValue({ error: null })
    clipsSelect.mockReturnValue({
      is: () => ({ limit: async () => ({ data: [] }) }),
    })
    copyLookupAvatarToBucket.mockResolvedValue(
      'https://example.supabase.co/storage/v1/object/public/vtuber-avatars/Nim/copied.png',
    )
  })

  it('ignores a client-sent remote avatar URL and copies from a fresh lookup of the link', async () => {
    const { POST } = await import('./route')
    const res = await POST(postBody({
      name: 'Pipuru',
      handle: 'pipuru',
      platform: 'Twitch',
      link: 'https://www.twitch.tv/pipuru',
      bio: 'Hello',
      avatar_url: 'https://static-cdn.jtvnw.net/jtv_user_pictures/x-profile_image-600x600.png',
    }))
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.ok).toBe(true)
    expect(copyLookupAvatarToBucket).toHaveBeenCalledWith('https://www.twitch.tv/pipuru', 'Nim')
    const inserted = vtuberInsert.mock.calls[0][0]
    expect(inserted.avatar_url).toContain('vtuber-avatars')
    expect(inserted.avatar_url).not.toContain('static-cdn.jtvnw.net')
  })

  it('keeps an avatar the client uploaded through the signed-in avatar route', async () => {
    const uploaded = 'https://example.supabase.co/storage/v1/object/public/vtuber-avatars/Nim/a.png'
    const { POST } = await import('./route')
    const res = await POST(postBody({
      name: 'Pipuru',
      handle: 'pipuru',
      platform: 'Twitch',
      link: 'https://www.twitch.tv/pipuru',
      avatar_url: uploaded,
    }))
    expect(res.status).toBe(201)
    expect(copyLookupAvatarToBucket).not.toHaveBeenCalled()
    expect(vtuberInsert.mock.calls[0][0].avatar_url).toBe(uploaded)
  })

  it('does not copy a looked-up avatar when the submitter cleared the preview', async () => {
    const { POST } = await import('./route')
    const res = await POST(postBody({
      name: 'Pipuru',
      handle: 'pipuru',
      platform: 'Twitch',
      link: 'https://www.twitch.tv/pipuru',
      skip_avatar: true,
    }))
    expect(res.status).toBe(201)
    expect(copyLookupAvatarToBucket).not.toHaveBeenCalled()
    expect(vtuberInsert.mock.calls[0][0].avatar_url).toBeNull()
  })

  it('stores a live niche id and a suggested category, and allows submitting with no tags', async () => {
    const { POST } = await import('./route')
    const withNiche = await POST(postBody({
      name: 'Pipuru',
      tags: ['clust_chaos', 'nclust_darkroom', 'wholesome', 'nsuggest:Liminal radio'],
      skip_avatar: true,
    }))
    expect(withNiche.status).toBe(201)
    expect(vtuberInsert.mock.calls[0][0].tags).toEqual(['clust_chaos', 'nclust_darkroom', 'wholesome', 'nsuggest:Liminal radio'])

    vtuberInsert.mockClear()
    const skipped = await POST(postBody({
      name: 'Another',
      skip_avatar: true,
    }))
    expect(skipped.status).toBe(201)
    expect(vtuberInsert.mock.calls[0][0].tags).toEqual([])
  })

  it('rejects ids that are not live niches or constellations', async () => {
    const { POST } = await import('./route')
    const unknownNiche = await POST(postBody({
      name: 'Pipuru',
      tags: ['nclust_cyber'],
      skip_avatar: true,
    }))
    expect(unknownNiche.status).toBe(400)

    const unknownCluster = await POST(postBody({
      name: 'Pipuru',
      tags: ['clust_fantasy'],
      skip_avatar: true,
    }))
    expect(unknownCluster.status).toBe(400)
    expect(vtuberInsert).not.toHaveBeenCalled()
  })
})
