import { describe, expect, it } from 'vitest'
import { sanitizeVtuberBio } from './vtuber-bio-sanitize'

describe('sanitizeVtuberBio', () => {
  it('keeps the creator wording when there is nothing to strip', () => {
    expect(sanitizeVtuberBio('Cozy variety VTuber. I love chatting and art.')).toBe(
      'Cozy variety VTuber. I love chatting and art.',
    )
  })

  it('returns a blank bio for empty, missing, or fully stripped input', () => {
    expect(sanitizeVtuberBio(null)).toBe('')
    expect(sanitizeVtuberBio(undefined)).toBe('')
    expect(sanitizeVtuberBio('   ')).toBe('')
    expect(sanitizeVtuberBio('contact me at hello@example.com')).toBe('contact me at')
    expect(sanitizeVtuberBio('Schedule:\nMon 7pm EST\nWed 8:00 PM PST')).toBe('')
    expect(sanitizeVtuberBio('use code SAVE20')).toBe('')
  })

  it('strips email addresses and leaves the surrounding words', () => {
    expect(sanitizeVtuberBio('Collabs: booked@example.com please.')).toBe('Collabs: please.')
    expect(sanitizeVtuberBio('Write to Name.Last+tag@sub.mail.co.uk any time.')).toBe('Write to any time.')
  })

  it('strips day-and-time listings but keeps mentions of a day with no time', () => {
    expect(sanitizeVtuberBio('I stream Monday 7PM EST and hang out after.')).toBe('I stream and hang out after.')
    expect(sanitizeVtuberBio('See you next Monday!')).toBe('See you next Monday!')
    expect(sanitizeVtuberBio("I've been streaming since 2020.")).toBe("I've been streaming since 2020.")
    expect(sanitizeVtuberBio('Tue/Thu 3:00 PM CST')).toBe('')
    expect(sanitizeVtuberBio('9:00 PM EST Mondays')).toBe('')
    expect(sanitizeVtuberBio('Catch me Friday at 8.')).toBe('Catch me.')
  })

  it('drops a Schedule heading and the listing lines under it', () => {
    const raw = [
      'Hello! I am a cozy VTuber.',
      'Schedule:',
      'Mon 7pm EST',
      'Wed 8pm EST',
      'Hope to see you!',
    ].join('\n')
    expect(sanitizeVtuberBio(raw)).toBe('Hello! I am a cozy VTuber.\nHope to see you!')
  })

  it('strips sponsor, affiliate, and promo-code phrases', () => {
    expect(sanitizeVtuberBio('I play games. Sponsored by GamerSupps. Come say hi.')).toBe(
      'I play games. Come say hi.',
    )
    expect(sanitizeVtuberBio('Support me with my affiliate link https://example.com/x and chat.')).toBe(
      'Support me with and chat.',
    )
    expect(sanitizeVtuberBio('Merch is up. Use code PIPURU at checkout.')).toBe('Merch is up. at checkout.')
    expect(sanitizeVtuberBio('Weekly streams and promo code SAVE20 inside.')).toBe('Weekly streams and inside.')
    expect(sanitizeVtuberBio('Tips welcome. Code: VT10')).toBe('Tips welcome.')
  })

  it('does not treat ordinary uses of the word code as a promo', () => {
    expect(sanitizeVtuberBio('I write code and love puzzle games.')).toBe('I write code and love puzzle games.')
  })

  it('truncates to 300 characters after stripping', () => {
    const raw = `${'A cozy VTuber. '.repeat(30)}use code AAA`
    const out = sanitizeVtuberBio(raw)
    expect(out.length).toBeLessThanOrEqual(300)
    expect(out.includes('use code')).toBe(false)
    expect(out.startsWith('A cozy VTuber.')).toBe(true)
  })
})
