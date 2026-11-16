import { describe, expect, it } from 'vitest'
import { validateClipUrl, CLIP_URL_ERRORS } from './embed-utils'

describe('validateClipUrl plain-words errors', () => {
  it('accepts a Twitch clip and a YouTube video', () => {
    expect(validateClipUrl('https://clips.twitch.tv/SomeClipSlug-abc123').valid).toBe(true)
    expect(validateClipUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ').valid).toBe(true)
  })
  it('asks for a link when empty', () => {
    expect(validateClipUrl('  ').error).toBe(CLIP_URL_ERRORS.empty)
  })
  it('explains a non-link', () => {
    expect(validateClipUrl('my favourite clip').error).toBe(CLIP_URL_ERRORS.notALink)
  })
  it('names the site for a channel page on a supported platform', () => {
    expect(validateClipUrl('https://www.twitch.tv/maikyua').error).toBe(CLIP_URL_ERRORS.channel('Twitch'))
  })
  it('says the site is not supported', () => {
    expect(validateClipUrl('https://www.tiktok.com/@someone/video/123').error).toBe(CLIP_URL_ERRORS.unsupported)
  })
  it('turns away Shorts', () => {
    expect(validateClipUrl('https://youtube.com/shorts/dQw4w9WgXcQ').error).toBe(CLIP_URL_ERRORS.shorts)
  })
})
