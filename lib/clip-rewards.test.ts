import { describe, expect, it, vi } from 'vitest'
import {
  CLIP_POST_DAILY_CAP,
  CLIP_POST_SCRAP_AMOUNT,
  clipPostAwardCappedMessage,
  clipPostAwardMessage,
  clipPostAwardSuccessMessage,
  clipRewardResetAt,
  clipRewardWindowStart,
  maybeAwardClipPostScraps,
  parseClipPostAwardResult,
} from './clip-rewards'

describe('clip reward UTC window', () => {
  it('uses the previous 08:00 UTC just before the reset', () => {
    const now = new Date('2026-11-10T07:59:59.999Z')
    expect(clipRewardWindowStart(now).toISOString()).toBe('2026-11-09T08:00:00.000Z')
    expect(clipRewardResetAt(now).toISOString()).toBe('2026-11-10T08:00:00.000Z')
  })

  it('starts a new window at exactly 08:00 UTC', () => {
    const now = new Date('2026-11-10T08:00:00.000Z')
    expect(clipRewardWindowStart(now).toISOString()).toBe('2026-11-10T08:00:00.000Z')
    expect(clipRewardResetAt(now).toISOString()).toBe('2026-11-11T08:00:00.000Z')
  })

  it('keeps the same window just after 08:00 UTC', () => {
    const now = new Date('2026-11-10T08:00:00.001Z')
    expect(clipRewardWindowStart(now).toISOString()).toBe('2026-11-10T08:00:00.000Z')
    expect(clipRewardResetAt(now).toISOString()).toBe('2026-11-11T08:00:00.000Z')
  })

  it('crosses a month end before and after 08:00 UTC', () => {
    const before = new Date('2026-12-01T07:59:59.999Z')
    expect(clipRewardWindowStart(before).toISOString()).toBe('2026-11-30T08:00:00.000Z')
    expect(clipRewardResetAt(before).toISOString()).toBe('2026-12-01T08:00:00.000Z')

    const after = new Date('2026-12-01T08:00:00.000Z')
    expect(clipRewardWindowStart(after).toISOString()).toBe('2026-12-01T08:00:00.000Z')
    expect(clipRewardResetAt(after).toISOString()).toBe('2026-12-02T08:00:00.000Z')
  })

  it('crosses a year end before and after 08:00 UTC', () => {
    const before = new Date('2027-01-01T07:59:59.999Z')
    expect(clipRewardWindowStart(before).toISOString()).toBe('2026-12-31T08:00:00.000Z')
    expect(clipRewardResetAt(before).toISOString()).toBe('2027-01-01T08:00:00.000Z')

    const after = new Date('2027-01-01T08:00:00.000Z')
    expect(clipRewardWindowStart(after).toISOString()).toBe('2027-01-01T08:00:00.000Z')
    expect(clipRewardResetAt(after).toISOString()).toBe('2027-01-02T08:00:00.000Z')
  })
})

describe('clip reward messages', () => {
  it('formats a successful award', () => {
    expect(clipPostAwardSuccessMessage(CLIP_POST_SCRAP_AMOUNT, 3, CLIP_POST_DAILY_CAP)).toBe(
      '+5 scraps · 3 of 5 today',
    )
  })

  it('formats the cap notice with the visitor local time of 08:00 UTC', () => {
    const reset = new Date('2026-11-11T08:00:00.000Z')
    const msg = clipPostAwardCappedMessage(reset, 'America/Chicago')
    expect(msg.startsWith("Clip posted. You've earned today's 5 clip rewards; they reset at 8:00 UTC (")).toBe(true)
    expect(msg.endsWith(')')).toBe(true)
    expect(msg).toMatch(/2:00/)
    expect(msg).toMatch(/AM/)
  })

  it('picks the success or cap string from an award payload', () => {
    expect(
      clipPostAwardMessage({
        awarded: 5,
        count_today: 3,
        daily_cap: 5,
        capped: false,
        reset_at: '2026-11-11T08:00:00.000Z',
      }),
    ).toBe('+5 scraps · 3 of 5 today')

    const capped = clipPostAwardMessage(
      {
        awarded: 0,
        count_today: 5,
        daily_cap: 5,
        capped: true,
        reset_at: '2026-11-11T08:00:00.000Z',
      },
      'America/Chicago',
    )
    expect(capped).toContain('8:00 UTC')
    expect(clipPostAwardMessage(null)).toBeNull()
    expect(
      clipPostAwardMessage({
        awarded: 0,
        count_today: 0,
        daily_cap: 5,
        capped: false,
        reset_at: '2026-11-11T08:00:00.000Z',
      }),
    ).toBeNull()
  })
})

describe('maybeAwardClipPostScraps', () => {
  it('awards when the rpc succeeds', async () => {
    const rpc = vi.fn(async () => ({
      data: { awarded: 5, count_today: 2, capped: false, reset_at: '2026-11-11T08:00:00+00:00' },
      error: null,
    }))
    await expect(maybeAwardClipPostScraps('alice', 'clip-1', rpc)).resolves.toEqual({
      awarded: 5,
      count_today: 2,
      daily_cap: 5,
      capped: false,
      reset_at: '2026-11-11T08:00:00+00:00',
    })
    expect(rpc).toHaveBeenCalledWith('award_clip_post_scraps', {
      p_username: 'alice',
      p_clip_id: 'clip-1',
    })
  })

  it('returns a capped result without awarding', async () => {
    const rpc = vi.fn(async () => ({
      data: { awarded: 0, count_today: 5, capped: true, reset_at: '2026-11-11T08:00:00+00:00' },
      error: null,
    }))
    await expect(maybeAwardClipPostScraps('alice', 'clip-6', rpc)).resolves.toEqual({
      awarded: 0,
      count_today: 5,
      daily_cap: 5,
      capped: true,
      reset_at: '2026-11-11T08:00:00+00:00',
    })
  })

  it('skips guests and missing usernames without calling rpc', async () => {
    const rpc = vi.fn()
    await expect(maybeAwardClipPostScraps('guest', 'clip-1', rpc)).resolves.toBeNull()
    await expect(maybeAwardClipPostScraps(null, 'clip-1', rpc)).resolves.toBeNull()
    await expect(maybeAwardClipPostScraps(undefined, 'clip-1', rpc)).resolves.toBeNull()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('returns null when the rpc errors or throws', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const rpcError = vi.fn(async () => ({ data: null, error: { message: 'boom' } }))
    await expect(maybeAwardClipPostScraps('alice', 'clip-1', rpcError)).resolves.toBeNull()

    const rpcThrow = vi.fn(async () => {
      throw new Error('network')
    })
    await expect(maybeAwardClipPostScraps('alice', 'clip-1', rpcThrow)).resolves.toBeNull()
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})

describe('parseClipPostAwardResult', () => {
  it('rejects invalid payloads', () => {
    expect(parseClipPostAwardResult(null)).toBeNull()
    expect(parseClipPostAwardResult('nope')).toBeNull()
  })
})
