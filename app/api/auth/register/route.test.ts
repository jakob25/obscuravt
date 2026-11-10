import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { RESERVED_USERNAME_ERROR } from '@/lib/reserved-usernames'

const insert = vi.fn()
const single = vi.fn(async () => ({ data: null, error: null }))

vi.mock('@/lib/rate-limit', () => ({
  rateLimits: { auth: async () => ({ ok: true as const }) },
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => single(),
        }),
      }),
      insert: (row: unknown) => insert(row),
    }),
  },
}))

function registerRequest(username: string, password = 'longenoughpass') {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

describe('POST /api/auth/register reserved usernames', () => {
  beforeEach(() => {
    insert.mockReset()
    single.mockReset()
    single.mockResolvedValue({ data: null, error: null })
  })

  it.each(['Admin', ' jakob25 ', 'administrator', 'ROOT', 'mod', 'Moderator', 'system', ' staff ', 'support', 'ObscuraVT'])(
    'rejects reserved username %j without creating an account',
    async (username) => {
      const { POST } = await import('./route')
      const res = await POST(registerRequest(username))
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.error).toBe(RESERVED_USERNAME_ERROR)
      expect(insert).not.toHaveBeenCalled()
    },
  )

  it('still allows a normal username past the reserved check', async () => {
    insert.mockResolvedValue({ error: null })
    const { POST } = await import('./route')
    const res = await POST(registerRequest('NimFan'))
    expect(res.status).toBe(200)
    expect(insert).toHaveBeenCalled()
  })
})
