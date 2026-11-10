import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { signSession } from '@/lib/session'

const vtuberSingle = vi.fn()
const vtuberUpdateEq = vi.fn()
const profileUpsert = vi.fn()
const userSingle = vi.fn()
const userUpdateEq = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === 'vtubers') {
        return {
          select: () => ({
            eq: () => ({
              single: () => vtuberSingle(),
            }),
          }),
          update: () => ({
            eq: (...args: unknown[]) => vtuberUpdateEq(...args),
          }),
        }
      }
      if (table === 'user_claimed_profiles') {
        return {
          upsert: (...args: unknown[]) => profileUpsert(...args),
        }
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => userSingle(),
            }),
          }),
          update: () => ({
            eq: (...args: unknown[]) => userUpdateEq(...args),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    },
  },
}))

const PREV_ADMINS = process.env.ADMIN_USERNAMES

async function requestAs(username: string | null, body: Record<string, unknown> = { vtuberId: 'vt_pipuru' }) {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (username) {
    const token = await signSession(username, 'user')
    headers.set('cookie', `vtvault_session=${token}`)
  }
  return new NextRequest('http://localhost/api/vtubers/claim', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('POST /api/vtubers/claim', () => {
  beforeEach(() => {
    delete process.env.ADMIN_USERNAMES
    vtuberSingle.mockReset()
    vtuberUpdateEq.mockReset()
    profileUpsert.mockReset()
    userSingle.mockReset()
    userUpdateEq.mockReset()
    vtuberUpdateEq.mockResolvedValue({ error: null })
    profileUpsert.mockResolvedValue({ error: null })
    userSingle.mockResolvedValue({ data: { active_vtuber_id: null } })
    userUpdateEq.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    if (PREV_ADMINS === undefined) delete process.env.ADMIN_USERNAMES
    else process.env.ADMIN_USERNAMES = PREV_ADMINS
  })

  it('rejects a signed-out request', async () => {
    const { POST } = await import('./route')
    const res = await POST(await requestAs(null))
    const data = await res.json()
    expect(res.status).toBe(401)
    expect(data.error).toBe('Authentication required.')
    expect(vtuberSingle).not.toHaveBeenCalled()
  })

  it('returns 403 with a plain message for a signed-in non-admin', async () => {
    const { POST } = await import('./route')
    const res = await POST(await requestAs('Nim'))
    const data = await res.json()
    expect(res.status).toBe(403)
    expect(data.error).toBe('Forbidden.')
    expect(vtuberSingle).not.toHaveBeenCalled()
    expect(vtuberUpdateEq).not.toHaveBeenCalled()
    expect(profileUpsert).not.toHaveBeenCalled()
  })

  it('lets an admin link an unclaimed approved profile to their account', async () => {
    vtuberSingle.mockResolvedValue({
      data: { id: 'vt_pipuru', name: 'Pipuru', claimed_by: null, approved: true },
    })
    const { POST } = await import('./route')
    const res = await POST(await requestAs('BLUJAYRX'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toMatchObject({ ok: true, vtuberId: 'vt_pipuru', name: 'Pipuru' })
    expect(vtuberUpdateEq).toHaveBeenCalledWith('id', 'vt_pipuru')
    expect(profileUpsert).toHaveBeenCalled()
    const upserted = profileUpsert.mock.calls[0][0] as { username: string; vtuber_id: string }
    expect(upserted.username).toBe('BLUJAYRX')
    expect(upserted.vtuber_id).toBe('vt_pipuru')
  })
})
