import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const requireAuth = vi.fn()
const writes: { table: string; op: string; payload?: unknown }[] = []
let vtuberRow: Record<string, unknown> | null = null
let pendingRows: unknown[] = []

vi.mock('@/lib/session', () => ({ requireAuth: (r: NextRequest) => requireAuth(r) }))
vi.mock('@/lib/rate-limit', () => ({ rateLimits: { write: async () => ({ ok: true }) } }))
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      const chain: Record<string, unknown> = {}
      const self = () => chain
      Object.assign(chain, {
        select: self, eq: self, order: self,
        maybeSingle: async () => ({ data: table === 'vtubers' ? vtuberRow : null }),
        limit: async () => ({ data: table === 'profile_claim_requests' ? pendingRows : [] }),
        insert: async (payload: unknown) => { writes.push({ table, op: 'insert', payload }); return { error: null } },
        update: (payload: unknown) => { writes.push({ table, op: 'update', payload }); return chain },
      })
      return chain
    },
  },
}))

function post(body: unknown) {
  return new NextRequest('http://localhost/api/claim-requests', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } })
}

describe('POST /api/claim-requests', () => {
  beforeEach(() => {
    writes.length = 0
    vtuberRow = { id: 'vt_a', name: 'A', approved: true, claimed_by: null }
    pendingRows = []
    requireAuth.mockResolvedValue({ username: 'fan1', role: 'Fan' })
  })

  it('needs a signed-in user', async () => {
    requireAuth.mockResolvedValue(NextResponse.json({ error: 'Authentication required.' }, { status: 401 }))
    const { POST } = await import('./route')
    expect((await POST(post({ vtuberId: 'vt_a' }))).status).toBe(401)
    expect(writes).toHaveLength(0)
  })

  it('records a pending request and never touches the creator row', async () => {
    const { POST } = await import('./route')
    const res = await POST(post({ vtuberId: 'vt_a', proofLink: 'https://x.com/a/status/1' }))
    expect(res.status).toBe(200)
    expect(writes).toEqual([{ table: 'profile_claim_requests', op: 'insert', payload: expect.objectContaining({ vtuber_id: 'vt_a', requested_by: 'fan1', status: 'pending' }) }])
    expect(writes.some(w => w.table === 'vtubers')).toBe(false)
  })

  it('refuses a file someone already holds', async () => {
    vtuberRow = { id: 'vt_a', name: 'A', approved: true, claimed_by: 'someone' }
    const { POST } = await import('./route')
    expect((await POST(post({ vtuberId: 'vt_a' }))).status).toBe(409)
    expect(writes).toHaveLength(0)
  })

  it('does not stack duplicate pending requests', async () => {
    pendingRows = [{ id: 'r1' }]
    const { POST } = await import('./route')
    const body = await (await POST(post({ vtuberId: 'vt_a' }))).json()
    expect(body.duplicate).toBe(true)
    expect(writes).toHaveLength(0)
  })
})
