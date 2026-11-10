import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { isAdminUsername, requireAdmin, signSession } from './session'

const PREV = process.env.ADMIN_USERNAMES

afterEach(() => {
  if (PREV === undefined) delete process.env.ADMIN_USERNAMES
  else process.env.ADMIN_USERNAMES = PREV
})

describe('isAdminUsername', () => {
  it('treats only BLUJAYRX as an admin by default', () => {
    delete process.env.ADMIN_USERNAMES
    expect(isAdminUsername('BLUJAYRX')).toBe(true)
    expect(isAdminUsername('jakob25')).toBe(false)
    expect(isAdminUsername('admin')).toBe(false)
    expect(isAdminUsername('Admin')).toBe(false)
    expect(isAdminUsername('Nim')).toBe(false)
    expect(isAdminUsername(null)).toBe(false)
  })

  it('matches admin names after trimming and ignoring case', () => {
    process.env.ADMIN_USERNAMES = 'BLUJAYRX'
    expect(isAdminUsername('BLUJAYRX')).toBe(true)
    expect(isAdminUsername('blujayrx')).toBe(true)
    expect(isAdminUsername(' BluJayRX ')).toBe(true)
    expect(isAdminUsername('BLUJAYRX2')).toBe(false)
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

  it('does not treat jakob25 as an admin by default', async () => {
    delete process.env.ADMIN_USERNAMES
    const token = await signSession('jakob25', 'user')
    const req = new NextRequest('http://localhost/api/admin/pending', {
      headers: { cookie: `vtvault_session=${token}` },
    })
    const result = await requireAdmin(req)
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(403)
  })

  it('allows BLUJAYRX from the default list used by /api/auth/me', async () => {
    delete process.env.ADMIN_USERNAMES
    expect(isAdminUsername('BLUJAYRX')).toBe(true)
    const token = await signSession('BLUJAYRX', 'VTuber')
    const req = new NextRequest('http://localhost/api/admin/pending', {
      headers: { cookie: `vtvault_session=${token}` },
    })
    const result = await requireAdmin(req)
    expect(result).not.toBeInstanceOf(Response)
    expect((result as { username: string }).username).toBe('BLUJAYRX')
  })
})
