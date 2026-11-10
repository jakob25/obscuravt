import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAllowedHttpsUrl, safeFetchFollow } from './safe-fetch'

const hosts = ['static-cdn.jtvnw.net', 'yt3.ggpht.com', 'yt3.googleusercontent.com'] as const

describe('safeFetchFollow', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('follows a redirect only onto the same allowlist', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: { location: 'https://yt3.googleusercontent.com/b.png' },
      }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await safeFetchFollow('https://yt3.ggpht.com/a.png', hosts)
    expect(res?.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[1][0])).toBe('https://yt3.googleusercontent.com/b.png')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'manual' })
  })

  it('does not follow a redirect off the allowlist', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, {
      status: 302,
      headers: { location: 'https://evil.example/pwn.png' },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await safeFetchFollow('https://yt3.ggpht.com/a.png', hosts)
    expect(res).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects a starting URL that is not allowlisted', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await safeFetchFollow('https://evil.example/a.png', hosts)).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('isAllowedHttpsUrl', () => {
  it('requires https, no credentials, and an exact host', () => {
    expect(isAllowedHttpsUrl('https://yt3.ggpht.com/a.png', hosts)).toBe(true)
    expect(isAllowedHttpsUrl('http://yt3.ggpht.com/a.png', hosts)).toBe(false)
    expect(isAllowedHttpsUrl('https://user:pass@yt3.ggpht.com/a.png', hosts)).toBe(false)
  })
})
