import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { signSession } from '@/lib/session'

const state = vi.hoisted(() => ({ vtuberApproved: true, insertError: null as null | { code: string; message: string } }))
const insert = vi.fn()
const recordAuditLog = vi.fn()

vi.mock('@/lib/audit-log', () => ({ recordAuditLog: (...args: unknown[]) => recordAuditLog(...args) }))
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === 'vtubers') {
        const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: state.vtuberApproved ? { id: 'vt_pipuru_123456' } : null }) }
        return q
      }
      return {
        insert: (row: unknown) => {
          insert(row)
          return { select: () => ({ single: async () => (state.insertError ? { data: null, error: state.insertError } : { data: { id: 'credit-1' }, error: null }) }) }
        },
      }
    },
  },
}))

const credit = { producer_id: 'pr_neon_abcdef', vtuber_id: 'vt_pipuru_123456', song_title: 'Starfall', song_url: 'https://youtu.be/dQw4w9WgXcQ', role: 'composed' }

async function req(user: string | null, body: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (user) headers.cookie = `vtvault_session=${await signSession(user, 'VTuber')}`
  return new NextRequest('http://localhost/api/admin/producer-credits', { method: 'POST', headers, body: JSON.stringify(body) })
}

describe('POST /api/admin/producer-credits', () => {
  beforeEach(() => { insert.mockClear(); recordAuditLog.mockClear(); state.vtuberApproved = true; state.insertError = null })

  it('is admin only', async () => {
    const { POST } = await import('./route')
    expect((await POST(await req(null, credit))).status).toBe(401)
    expect((await POST(await req('randomfan', credit))).status).toBe(403)
    expect(insert).not.toHaveBeenCalled()
  })

  it('adds a credit with its source link and logs it', async () => {
    const { POST } = await import('./route')
    const res = await POST(await req('BLUJAYRX', credit))
    expect(res.status).toBe(200)
    expect(insert).toHaveBeenCalledWith(credit)
    expect(recordAuditLog).toHaveBeenCalledWith('BLUJAYRX', 'producer_credit_added', 'producer', 'pr_neon_abcdef', { credit_id: 'credit-1', vtuber_id: 'vt_pipuru_123456', role: 'composed' })
  })

  it('needs a source link and an approved VTuber file', async () => {
    const { POST } = await import('./route')
    expect((await POST(await req('BLUJAYRX', { ...credit, song_url: '' }))).status).toBe(400)
    state.vtuberApproved = false
    expect((await POST(await req('BLUJAYRX', credit))).status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })

  it('reports duplicates plainly', async () => {
    state.insertError = { code: '23505', message: 'duplicate' }
    const { POST } = await import('./route')
    const res = await POST(await req('BLUJAYRX', credit))
    expect(res.status).toBe(409)
  })
})
