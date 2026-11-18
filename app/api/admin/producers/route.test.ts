import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { signSession } from '@/lib/session'

const insert = vi.fn()
const recordAuditLog = vi.fn()
const avatar = vi.fn<(links: unknown) => Promise<string | null>>(async () => null)

vi.mock('@/lib/audit-log', () => ({ recordAuditLog: (...args: unknown[]) => recordAuditLog(...args) }))
vi.mock('@/lib/producer-avatar', () => ({ producerAvatarFromChannels: (links: unknown) => avatar(links) }))
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      insert: async (row: unknown) => { insert(row); return { error: null } },
      select: () => ({ order: () => ({ limit: async () => ({ data: [{ id: 'pr_a_abcdef', name: 'A' }], error: null }) }) }),
    }),
  },
}))

async function req(user: string | null, body?: unknown, method = 'POST') {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (user) headers.cookie = `vtvault_session=${await signSession(user, 'VTuber')}`
  return new NextRequest('http://localhost/api/admin/producers', { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
}

describe('/api/admin/producers', () => {
  beforeEach(() => { insert.mockClear(); recordAuditLog.mockClear(); avatar.mockClear() })

  it('refuses anyone who is not an admin', async () => {
    const { POST, GET } = await import('./route')
    expect((await POST(await req(null, { name: 'A' }))).status).toBe(401)
    expect((await POST(await req('randomfan', { name: 'A' }))).status).toBe(403)
    expect((await GET(await req('randomfan', undefined, 'GET'))).status).toBe(403)
    expect(insert).not.toHaveBeenCalled()
  })

  it('adds a producer as admin, with the picture only from the channel lookup', async () => {
    avatar.mockResolvedValueOnce('https://yt3.ggpht.com/pic')
    const { POST } = await import('./route')
    const res = await POST(await req('BLUJAYRX', { name: 'Neon', services: ['stream_bgm'], youtube: 'https://www.youtube.com/@neon', avatar_url: 'https://vgen.co/x.png' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.id).toMatch(/^pr_neon_[a-f0-9]{6}$/)
    const row = insert.mock.calls[0][0] as Record<string, unknown>
    expect(row.avatar_url).toBe('https://yt3.ggpht.com/pic')
    expect(row).not.toHaveProperty('approved')
    expect(recordAuditLog).toHaveBeenCalledWith('BLUJAYRX', 'producer_added', 'producer', body.id)
  })

  it('rejects bad input without writing', async () => {
    const { POST } = await import('./route')
    expect((await POST(await req('BLUJAYRX', { name: '' }))).status).toBe(400)
    expect((await POST(await req('BLUJAYRX', { name: 'A', x: 'javascript:alert(1)' }))).status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })

  it('lists producers for the admin credit picker', async () => {
    const { GET } = await import('./route')
    const res = await GET(await req('BLUJAYRX', undefined, 'GET'))
    expect(await res.json()).toEqual({ producers: [{ id: 'pr_a_abcdef', name: 'A' }] })
  })
})
