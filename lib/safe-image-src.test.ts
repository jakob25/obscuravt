import { describe, expect, it } from 'vitest'
import { safeImageSrc } from './safe-image-src'

describe('safeImageSrc', () => {
  it('allows https and blob previews', () => {
    expect(safeImageSrc('https://abc.supabase.co/storage/v1/object/public/vtuber-avatars/u/1.png')).toBe('https://abc.supabase.co/storage/v1/object/public/vtuber-avatars/u/1.png')
    expect(safeImageSrc('blob:https://obscuravt.com/1234-5678')).toBe('blob:https://obscuravt.com/1234-5678')
  })
  it('refuses everything else', () => {
    for (const bad of ['javascript:alert(1)', 'data:image/svg+xml,<svg onload=alert(1)>', 'http://x.com/a.png', '/relative.png', '', null, undefined]) {
      expect(safeImageSrc(bad as string | null | undefined)).toBeNull()
    }
  })
})
