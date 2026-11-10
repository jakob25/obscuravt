import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const lookupVtuberProfile = vi.fn()
const safeFetchFollow = vi.fn()
const upload = vi.fn()
const getPublicUrl = vi.fn()
const storageFrom = vi.fn((_bucket: string) => ({ upload, getPublicUrl }))

vi.mock('./vtuber-profile-lookup', () => ({
  lookupVtuberProfile: (...args: unknown[]) => lookupVtuberProfile(...args),
}))

vi.mock('./safe-fetch', async () => {
  const actual = await vi.importActual<typeof import('./safe-fetch')>('./safe-fetch')
  return {
    ...actual,
    safeFetchFollow: (...args: unknown[]) => safeFetchFollow(...args),
  }
})

vi.mock('./supabase', () => ({
  supabaseAdmin: {
    storage: { from: (bucket: string) => storageFrom(bucket) },
  },
}))

import { copyLookupAvatarToBucket, isStoredVtuberAvatarUrl } from './vtuber-avatar-copy'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 1, 2, 3])

describe('isStoredVtuberAvatarUrl', () => {
  const prev = process.env.NEXT_PUBLIC_SUPABASE_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  })

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = prev
  })

  it('accepts only public URLs from this project\'s vtuber-avatars bucket', () => {
    expect(isStoredVtuberAvatarUrl('https://example.supabase.co/storage/v1/object/public/vtuber-avatars/Nim/a.png')).toBe(true)
    expect(isStoredVtuberAvatarUrl('https://static-cdn.jtvnw.net/jtv_user_pictures/x-profile_image-600x600.png')).toBe(false)
    expect(isStoredVtuberAvatarUrl('https://yt3.ggpht.com/abc')).toBe(false)
    expect(isStoredVtuberAvatarUrl('https://evil.supabase.co/storage/v1/object/public/vtuber-avatars/Nim/a.png')).toBe(false)
    expect(isStoredVtuberAvatarUrl('https://example.supabase.co/storage/v1/object/public/other-bucket/a.png')).toBe(false)
    expect(isStoredVtuberAvatarUrl('https://user:pass@example.supabase.co/storage/v1/object/public/vtuber-avatars/a.png')).toBe(false)
    expect(isStoredVtuberAvatarUrl(null)).toBe(false)
  })
})

describe('copyLookupAvatarToBucket', () => {
  beforeEach(() => {
    lookupVtuberProfile.mockReset()
    safeFetchFollow.mockReset()
    upload.mockReset()
    getPublicUrl.mockReset()
    storageFrom.mockClear()
    upload.mockResolvedValue({ error: null })
    getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/vtuber-avatars/Nim/copied.png' },
    })
  })

  it('re-runs lookup, downloads the official avatar, and uploads it to the bucket', async () => {
    lookupVtuberProfile.mockResolvedValue({
      avatarUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/x-profile_image-600x600.png',
    })
    safeFetchFollow.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: async () => PNG.buffer,
    })

    const url = await copyLookupAvatarToBucket('https://www.twitch.tv/pipuru', 'Nim')
    expect(lookupVtuberProfile).toHaveBeenCalledWith('https://www.twitch.tv/pipuru')
    expect(safeFetchFollow).toHaveBeenCalled()
    expect(String(safeFetchFollow.mock.calls[0][0])).toContain('static-cdn.jtvnw.net')
    expect(storageFrom).toHaveBeenCalledWith('vtuber-avatars')
    expect(upload).toHaveBeenCalled()
    expect(url).toContain('vtuber-avatars')
  })

  it('does not fetch a client-shaped URL and returns null when lookup has no avatar', async () => {
    lookupVtuberProfile.mockResolvedValue({ avatarUrl: null })
    const url = await copyLookupAvatarToBucket('https://x.com/obscura_vt', 'Nim')
    expect(safeFetchFollow).not.toHaveBeenCalled()
    expect(upload).not.toHaveBeenCalled()
    expect(url).toBeNull()
  })

  it('refuses to download an avatar host that is not on the allowlist, even if lookup returned one', async () => {
    lookupVtuberProfile.mockResolvedValue({ avatarUrl: 'https://evil.example/pic.png' })
    const url = await copyLookupAvatarToBucket('https://www.twitch.tv/pipuru', 'Nim')
    expect(safeFetchFollow).not.toHaveBeenCalled()
    expect(upload).not.toHaveBeenCalled()
    expect(url).toBeNull()
  })
})
