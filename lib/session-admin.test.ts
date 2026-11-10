import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { isAdminUsername, requireAdmin, signSession } from './session'

const PREV = process.env.ADMIN_USERNAMES

afterEach(() => {
  if (PREV === undefined) delete process.env.ADMIN_USERNAMES
  else process.env.ADMIN_USERNAMES = PREV
})

describe('isAdminUsername', () => {
  it('treats the default list as jakob25 and admin', () => {
    delete process.env.ADMIN_USERNAMES
    expect(isAdminUsername('jakob25')).toBe(true)
    expect(isAdminUsername('admin')).toBe(true)
    expect(isAdminUsername('Nim')).toBe(false)
    expect(isAdminUsername(null)).toBe(false)
  })

  it('reads ADMIN_USERNAMES on each call', () => {
    process.env.ADMIN_USERNAMES = 'alice,bob'
    expect(isAdminUsername('alice')).toBe(true)
    expect(isAdminUsername('bob')).toBe(true)
    expect(isAdminUsername('jakob25')).toBe(false)
  })
})

describe('requireAdmin', () => {
  it('rejects a missing session', async () => {
    const req = new NextRequest('http://localhost/api/admin/pending')
    const result = await requireAdmin(req)
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(401)
  })

  it('rejects a signed-in non-admin', async () => {
    delete process.env.ADMIN_USERNAMES
    const token = await signSession('Nim', 'user')
    const req = new NextRequest('http://localhost/api/admin/pending', {
      headers: { cookie: `vtvault_session=${token}` },
    })
    const result = await requireAdmin(req)
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(403)
  })

  it('allows a signed-in admin from the server list', async () => {
    delete process.env.ADMIN_USERNAMES
    const token = await signSession('jakob25', 'user')
    const req = new NextRequest('http://localhost/api/admin/pending', {
      headers: { cookie: `vtvault_session=${token}` },
    })
    const result = await requireAdmin(req)
    expect(result).not.toBeInstanceOf(Response)
    expect((result as { username: string }).username).toBe('jakob25')
  })
})
