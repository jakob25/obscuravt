import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const requireAdmin = vi.fn()
const ops: { table: string; op: string; payload?: unknown; filters: string[] }[] = []
let request: Record<string, unknown> | null = null
let vtuber: Record<string, unknown> | null = null

vi.mock('@/lib/session', () => ({ requireAdmin: (r: NextRequest) => requireAdmin(r) }))
vi.mock('@/lib/audit-log', () => ({ recordAuditLog: async () => {} }))
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      const rec = { table, op: 'select', payload: undefined as unknown, filters: [] as string[] }
      const chain: Record<string, unknown> = {}
      Object.assign(chain, {
        select: () => { if (rec.op !== 'update') rec.op = 'select'; return rec.op === 'update' ? Promise.resolve({ data: [{ id: 'x' }], error: null }) : chain },
        eq: (c: string, v: unknown) => { rec.filters.push(`${c}=${v}`); return chain },
        is: (c: string) => { rec.filters.push(`${c} is null`); return chain },
        maybeSingle: async () => ({ data: table === 'profile_claim_requests' ? request : vtuber }),
        update: (payload: unknown) => { rec.op = 'update'; rec.payload = payload; ops.push(rec); return chain },
        upsert: async (payload: unknown) => { ops.push({ table, op: 'upsert', payload, filters: [] }); return { error: null } },
        then: (res: (v: unknown) => void) => res({ error: null }),
      })
      return chain
    },
  },
}))

const post = (body: unknown) => new NextRequest('http://localhost/api/admin/claim-requests', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } })

describe('POST /api/admin/claim-requests', () => {
  beforeEach(() => {
    ops.length = 0
    requireAdmin.mockResolvedValue({ username: 'jacob', role: 'Admin' })
    request = { id: 'r1', vtuber_id: 'vt_a', requested_by: 'creator1', status: 'pending' }
    vtuber = { id: 'vt_a', claimed_by: null, approved: true }
  })

  it('is admin-only', async () => {
    requireAdmin.mockResolvedValue(NextResponse.json({ error: 'nope' }, { status: 403 }))
    const { POST } = await import('./route')
    expect((await POST(post({ id: 'r1', decision: 'approve' }))).status).toBe(403)
    expect(ops).toHaveLength(0)
  })

  it('approval grants the file to the requester only while unclaimed', async () => {
    const { POST } = await import('./route')
    const res = await POST(post({ id: 'r1', decision: 'approve' }))
    expect(res.status).toBe(200)
    const grant = ops.find(o => o.table === 'vtubers' && o.op === 'update')
    expect(grant?.payload).toMatchObject({ claimed_by: 'creator1', is_claimed: true })
    expect(grant?.filters).toContain('claimed_by is null')
    expect(ops.find(o => o.table === 'profile_claim_requests' && o.op === 'update')?.payload).toMatchObject({ status: 'approved', reviewed_by: 'jacob' })
  })

  it('rejecting never touches the creator row', async () => {
    const { POST } = await import('./route')
    await POST(post({ id: 'r1', decision: 'reject' }))
    expect(ops.some(o => o.table === 'vtubers')).toBe(false)
  })

  it('will not hand over a file someone else holds', async () => {
    vtuber = { id: 'vt_a', claimed_by: 'other', approved: true }
    const { POST } = await import('./route')
    expect((await POST(post({ id: 'r1', decision: 'approve' }))).status).toBe(409)
    expect(ops.some(o => o.table === 'vtubers' && o.op === 'update')).toBe(false)
  })
})
