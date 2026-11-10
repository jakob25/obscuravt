import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { signSession } from '@/lib/session'

const update = vi.fn()
const recordAuditLog = vi.fn()

vi.mock('@/lib/audit-log', () => ({
  recordAuditLog: (...args: unknown[]) => recordAuditLog(...args),
}))

vi.mock('@/lib/creator-match', () => ({
  creatorKeys: () => [],
  loadCreators: async () => [],
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      update: (payload: unknown) => {
        update(payload)
        return { eq: async () => ({ error: null }) }
      },
      delete: () => ({ eq: async () => ({ error: null }) }),
    }),
  },
}))

describe('PATCH /api/admin/pending', () => {
  beforeEach(() => {
    update.mockClear()
    recordAuditLog.mockClear()
  })

  it('approves a nomination by only flipping approved, leaving tags in place', async () => {
    const token = await signSession('BLUJAYRX', 'VTuber')
    const { PATCH } = await import('./route')
    const req = new NextRequest('http://localhost/api/admin/pending', {
      method: 'PATCH',
      headers: {
        cookie: `vtvault_session=${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ vtuberId: 'vt_pipuru', approved: true }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, approved: true })
    expect(update).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith({ approved: true })
    expect(Object.keys(update.mock.calls[0][0])).toEqual(['approved'])
    expect(recordAuditLog).toHaveBeenCalledWith('BLUJAYRX', 'vtuber_approved', 'vtuber', 'vt_pipuru')
  })
})
