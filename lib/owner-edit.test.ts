import { describe, expect, it, vi } from 'vitest'

const ownsVtuber = vi.fn(async () => true)
vi.mock('@/lib/owns-vtuber', () => ({ ownsVtuber: () => ownsVtuber() }))

import { canEditOwnFile, validateOwnerEdit } from './owner-edit'
import { isOwnUploadedAvatar } from './avatar-path'

const SB = 'https://abc.supabase.co'
const mine = `${SB}/storage/v1/object/public/vtuber-avatars/mai_k/1700000000-ab12cd34.png`

describe('owner edit rules', () => {
  it('needs the approved claimant on the row and the shared ownership check', async () => {
    expect(await canEditOwnFile('mai_k', 'vt_1', { claimed_by: 'mai_k', claim_approved_at: '2026-11-16T00:00:00Z' })).toBe(true)
    expect(await canEditOwnFile('mai_k', 'vt_1', { claimed_by: 'mai_k', claim_approved_at: null })).toBe(false)
    expect(await canEditOwnFile('mai_k', 'vt_1', { claimed_by: 'someone', claim_approved_at: '2026-11-16T00:00:00Z' })).toBe(false)
    expect(await canEditOwnFile('mai_k', 'vt_1', null)).toBe(false)
    ownsVtuber.mockResolvedValueOnce(false)
    expect(await canEditOwnFile('mai_k', 'vt_1', { claimed_by: 'mai_k', claim_approved_at: '2026-11-16T00:00:00Z' })).toBe(false)
  })

  it('accepts any words in a bio up to the limit, no filtering', () => {
    const r = validateOwnerEdit({ bio: '  18+ chaos goblin, swears a lot  ' }, 'mai_k', SB)
    expect(r).toEqual({ ok: true, updates: { bio: '18+ chaos goblin, swears a lot' } })
    expect(validateOwnerEdit({ bio: 'x'.repeat(501) }, 'mai_k', SB).ok).toBe(false)
  })

  it('only takes pictures this user uploaded through the avatar route', () => {
    expect(isOwnUploadedAvatar(mine, 'mai_k', SB)).toBe(true)
    expect(validateOwnerEdit({ avatar_url: mine }, 'mai_k', SB).ok).toBe(true)
    expect(validateOwnerEdit({ avatar_url: mine }, 'other', SB).ok).toBe(false)
    expect(validateOwnerEdit({ avatar_url: 'https://evil.example/x.png' }, 'mai_k', SB).ok).toBe(false)
    expect(validateOwnerEdit({ avatar_url: `${mine}/../../x` }, 'mai_k', SB).ok).toBe(false)
  })

  it('accepts a clean https link and a handle', () => {
    const r = validateOwnerEdit({ link: 'https://twitch.tv/mai', handle: '@Mai_K' }, 'mai_k', SB)
    expect(r).toEqual({ ok: true, updates: { link: 'https://twitch.tv/mai', handle: 'Mai_K' } })
    expect(validateOwnerEdit({ link: 'http://nope' }, 'mai_k', SB).ok).toBe(false)
    expect(validateOwnerEdit({ handle: 'bad handle!' }, 'mai_k', SB).ok).toBe(false)
  })

  it('accepts a short tag list and dedupes', () => {
    const r = validateOwnerEdit({ tags: ['chill', ' horror ', 'chill'] }, 'mai_k', SB)
    expect(r).toEqual({ ok: true, updates: { tags: ['chill', 'horror'] } })
    expect(validateOwnerEdit({ tags: Array(13).fill('a') }, 'mai_k', SB).ok).toBe(false)
  })

  it('ignores name and claim columns', () => {
    const r = validateOwnerEdit({ bio: 'hi', ...( { name: 'X', claimed_by: 'z' } as object) }, 'mai_k', SB)
    expect(r).toEqual({ ok: true, updates: { bio: 'hi' } })
    expect(validateOwnerEdit({}, 'mai_k', SB).ok).toBe(false)
  })
})
