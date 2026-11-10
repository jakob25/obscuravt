import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { signSession } from '@/lib/session'

const update = vi.fn()
const select = vi.fn()
const del = vi.fn()
const ownsVtuber = vi.fn(async (_username: string, _vtuberId: string) => false)

vi.mock('@/lib/owns-vtuber', () => ({
  ownsVtuber: (username: string, vtuberId: string) => ownsVtuber(username, vtuberId),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      select: (...args: unknown[]) => {
        select(...args)
        return {
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
          order: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }
      },
      update: (...args: unknown[]) => {
        update(...args)
        return { eq: async () => ({ error: null }) }
      },
      delete: (...args: unknown[]) => {
        del(...args)
        return { eq: async () => ({ error: null }) }
      },
    }),
  },
}))

async function fanRequest(url: string, init: ConstructorParameters<typeof NextRequest>[1] = {}) {
  const token = await signSession('Nim', 'user')
  const headers = new Headers(init.headers)
  headers.set('cookie', `vtvault_session=${token}`)
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return new NextRequest(url, { ...init, headers })
}

describe('admin APIs ignore a client isAdmin flag', () => {
  beforeEach(() => {
    update.mockClear()
    select.mockClear()
    del.mockClear()
    ownsVtuber.mockClear()
    ownsVtuber.mockResolvedValue(false)
  })

  it('rejects pending approve/reject from a non-admin even if the body claims isAdmin', async () => {
    const { PATCH } = await import('./pending/route')
    const req = await fanRequest('http://localhost/api/admin/pending', {
      method: 'PATCH',
      body: JSON.stringify({ vtuberId: 'vt_should_not_change', approved: true, isAdmin: true }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(403)
    expect(update).not.toHaveBeenCalled()
    expect(del).not.toHaveBeenCalled()
  })

  it('rejects pending list from a non-admin even if a query claims isAdmin', async () => {
    const { GET } = await import('./pending/route')
    const req = await fanRequest('http://localhost/api/admin/pending?isAdmin=true')
    const res = await GET(req)
    expect(res.status).toBe(403)
    expect(select).not.toHaveBeenCalled()
  })

  it('rejects audit reads from a non-admin even if a query claims isAdmin', async () => {
    const { GET } = await import('./audit/route')
    const req = await fanRequest('http://localhost/api/admin/audit?isAdmin=true')
    const res = await GET(req)
    expect(res.status).toBe(403)
    expect(select).not.toHaveBeenCalled()
  })

  it('rejects silhouette writes from a non-admin non-owner even if the body claims isAdmin', async () => {
    const { PATCH } = await import('../discovery-games/silhouette/route')
    const req = await fanRequest('http://localhost/api/discovery-games/silhouette', {
      method: 'PATCH',
      body: JSON.stringify({
        vtuberId: 'vt_should_not_change',
        silhouette_url: 'https://example.com/nope.png',
        isAdmin: true,
      }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(403)
    expect(update).not.toHaveBeenCalled()
  })
})
