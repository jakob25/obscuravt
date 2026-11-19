import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const requireAuth = vi.fn()
const canEdit = vi.fn(async () => true)
const ops: { table: string; op: string; payload: unknown }[] = []
let logError: { message: string } | null = null

vi.mock('@/lib/session', () => ({ requireAuth: (r: NextRequest) => requireAuth(r) }))
vi.mock('@/lib/rate-limit', () => ({ rateLimits: { write: async () => ({ ok: true }) } }))
vi.mock('@/lib/owns-vtuber', () => ({ ownsVtuber: async () => true }))
vi.mock('@/lib/owner-edit', async (orig) => {
  const actual = await orig<typeof import('@/lib/owner-edit')>()
  return { ...actual, canEditOwnFile: () => canEdit() }
})
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      const chain: Record<string, unknown> = {}
      Object.assign(chain, {
        select: () => chain, eq: () => chain,
        maybeSingle: async () => ({ data: { id: 'vt_1', bio: 'old bio', avatar_url: 'https://old/pic.png', claimed_by: 'mai_k', claim_approved_at: '2026-11-16' } }),
        insert: async (payload: unknown) => { ops.push({ table, op: 'insert', payload }); return { error: logError } },
        update: (payload: unknown) => { ops.push({ table, op: 'update', payload }); const c: Record<string, unknown> = { eq: () => c, then: (r: (v: unknown) => void) => r({ error: null }) }; return c },
      })
      return chain
    },
  },
}))

const patch = (body: unknown) => new NextRequest('http://localhost/api/vtubers/owner-edit', { method: 'PATCH', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } })

describe('PATCH /api/vtubers/owner-edit', () => {
  beforeEach(() => {
    ops.length = 0; logError = null
    requireAuth.mockResolvedValue({ username: 'mai_k', role: 'VTuber' })
    canEdit.mockResolvedValue(true)
  })

  it('refuses anyone who is not the approved owner', async () => {
    canEdit.mockResolvedValue(false)
    const { PATCH } = await import('./route')
    expect((await PATCH(patch({ vtuberId: 'vt_1', bio: 'new' }))).status).toBe(403)
    expect(ops).toHaveLength(0)
  })

  it('logs the previous bio, then writes only the bio', async () => {
    const { PATCH } = await import('./route')
    const res = await PATCH(patch({ vtuberId: 'vt_1', bio: 'new bio', name: 'Hacked', is_claimed: false, claimed_by: 'someone_else' }))
    expect(res.status).toBe(200)
    expect(ops[0]).toMatchObject({ table: 'automation_log', op: 'insert' })
    expect(JSON.parse((ops[0].payload as { tag: string }).tag).prev).toEqual({ bio: 'old bio' })
    expect(ops[1]).toEqual({ table: 'vtubers', op: 'update', payload: { bio: 'new bio' } })
  })

  it('does not edit if the previous version cannot be kept', async () => {
    logError = { message: 'boom' }
    const { PATCH } = await import('./route')
    expect((await PATCH(patch({ vtuberId: 'vt_1', bio: 'new' }))).status).toBe(500)
    expect(ops.some(o => o.table === 'vtubers')).toBe(false)
  })
})
