import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const requireAuth = vi.fn()
const writeLimit = vi.fn(async (_req?: NextRequest) => ({ ok: true as const }))
const upload = vi.fn()
const getPublicUrl = vi.fn()
const storageFrom = vi.fn((_bucket: string) => ({ upload, getPublicUrl }))
const tableFrom = vi.fn((_table: string) => {
  throw new Error('avatar route must not write a vtubers row')
})

vi.mock('@/lib/session', () => ({
  requireAuth: (req: NextRequest) => requireAuth(req),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimits: { write: (req: NextRequest) => writeLimit(req) },
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    storage: {
      from: (bucket: string) => storageFrom(bucket),
    },
    from: (table: string) => tableFrom(table),
  },
}))

function pngFile(type = 'image/png', size = 8) {
  return new File([new Uint8Array(size)], 'avatar.png', { type })
}

function postFile(file?: File) {
  const body = new FormData()
  if (file) body.append('file', file)
  return new NextRequest('http://localhost/api/vtubers/avatar', {
    method: 'POST',
    body,
  })
}

describe('POST /api/vtubers/avatar', () => {
  beforeEach(() => {
    requireAuth.mockReset()
    writeLimit.mockClear()
    upload.mockReset()
    getPublicUrl.mockReset()
    storageFrom.mockClear()
    tableFrom.mockClear()
    requireAuth.mockResolvedValue({ username: 'Nim', role: 'user', iat: 1, exp: 2 })
    upload.mockResolvedValue({ error: null })
    getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/vtuber-avatars/Nim/a.png' },
    })
  })

  it('rejects a signed-out upload', async () => {
    requireAuth.mockResolvedValue(
      NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
    )
    const { POST } = await import('./route')
    const res = await POST(postFile(pngFile()))
    expect(res.status).toBe(401)
    expect(storageFrom).not.toHaveBeenCalled()
    expect(tableFrom).not.toHaveBeenCalled()
  })

  it('rejects a disallowed type before storage', async () => {
    const { POST } = await import('./route')
    const res = await POST(postFile(pngFile('image/bmp')))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toMatch(/JPEG, PNG, GIF, or WebP/i)
    expect(storageFrom).not.toHaveBeenCalled()
  })

  it('rejects a file over 5MB before storage', async () => {
    const { POST } = await import('./route')
    const res = await POST(postFile(pngFile('image/png', 5 * 1024 * 1024 + 1)))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toMatch(/5MB/i)
    expect(storageFrom).not.toHaveBeenCalled()
  })

  it('uploads to vtuber-avatars with the service-role client and returns the public URL', async () => {
    const { POST } = await import('./route')
    const res = await POST(postFile(pngFile()))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.url).toContain('vtuber-avatars')
    expect(storageFrom).toHaveBeenCalledWith('vtuber-avatars')
    expect(upload).toHaveBeenCalled()
    expect(tableFrom).not.toHaveBeenCalled()
  })

  it('returns a clear message if storage fails, without creating a nomination', async () => {
    upload.mockResolvedValue({ error: { message: 'new row violates row-level security policy' } })
    const { POST } = await import('./route')
    const res = await POST(postFile(pngFile()))
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data.error).toBe(
      "Couldn't upload the profile picture. You can submit without one, or try a different image.",
    )
    expect(tableFrom).not.toHaveBeenCalled()
  })
})
