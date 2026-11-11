import { describe, expect, it } from 'vitest'
import {
  LIGHT_ACCENT_TARGET,
  LIGHT_ADJUST_BELOW,
  LIGHT_CANVAS_HEX,
  LIGHT_TEXT_TARGET,
  adjustColorForLightCanvas,
  colorForTheme,
  contrastRatio,
  parseHexColor,
} from './color-contrast'

/**
 * The 11 live niche_cluster colors from canonical_tags, checked this session
 * (2026-11-10) against the live catalog. Tests pin the helper's cutoff so only
 * Cursed ASMR lime is rewritten; do not special-case the room by name or id.
 */
const LIVE_ROOM_COLORS = [
  { name: 'The Darkroom', hex: '#c0392b' },
  { name: 'The Weather Station', hex: '#2980b9' },
  { name: 'The Kitchen', hex: '#e67e22' },
  { name: 'The Studio', hex: '#9b59b6' },
  { name: 'The Globe', hex: '#27ae60' },
  { name: 'The Lab', hex: '#1abc9c' },
  { name: 'The Arcade', hex: '#f39c12' },
  { name: 'The Atelier', hex: '#e91e8c' },
  { name: 'The Gym', hex: '#e74c3c' },
  { name: 'The Library', hex: '#8e44ad' },
  { name: 'Cursed ASMR', hex: '#39ff14' },
] as const

const LIME = '#39ff14'

function hueDegrees(hex: string): number {
  const parsed = parseHexColor(hex)
  if (!parsed) throw new Error(`bad hex ${hex}`)
  const r = parsed.r / 255
  const g = parsed.g / 255
  const b = parsed.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
  else if (max === g) h = ((b - r) / d + 2) * 60
  else h = ((r - g) / d + 4) * 60
  return h
}

describe('adjustColorForLightCanvas', () => {
  it('darkens a neon lime that fails the light-canvas contrast cutoff', () => {
    const adjusted = adjustColorForLightCanvas(LIME, 'accent')
    expect(adjusted).not.toBeNull()
    expect(adjusted!.toLowerCase()).not.toBe(LIME)
    const ratio = contrastRatio(adjusted!, LIGHT_CANVAS_HEX)
    expect(ratio).not.toBeNull()
    expect(ratio!).toBeGreaterThanOrEqual(LIGHT_ACCENT_TARGET - 0.05)
    // Hue stays in the green range (lime is ~110°).
    const hue = hueDegrees(adjusted!)
    expect(hue).toBeGreaterThan(80)
    expect(hue).toBeLessThan(150)
  })

  it('darkens lime further when the role is text', () => {
    const accent = adjustColorForLightCanvas(LIME, 'accent')!
    const text = adjustColorForLightCanvas(LIME, 'text')!
    expect(text.toLowerCase()).not.toBe(accent.toLowerCase())
    expect(contrastRatio(text, LIGHT_CANVAS_HEX)!).toBeGreaterThanOrEqual(LIGHT_TEXT_TARGET - 0.05)
    expect(contrastRatio(text, LIGHT_CANVAS_HEX)!).toBeGreaterThan(contrastRatio(accent, LIGHT_CANVAS_HEX)!)
  })

  it('returns already-dark colors unchanged', () => {
    expect(adjustColorForLightCanvas('#8e44ad')).toBe('#8e44ad')
    expect(adjustColorForLightCanvas('#c0392b')).toBe('#c0392b')
    expect(adjustColorForLightCanvas('  #2980b9  ')).toBe('#2980b9')
  })

  it('passes every current live room color through unchanged except Cursed ASMR lime', () => {
    const changed: string[] = []
    const unchanged: string[] = []
    for (const room of LIVE_ROOM_COLORS) {
      const ratio = contrastRatio(room.hex, LIGHT_CANVAS_HEX)
      expect(ratio, `${room.name} ${room.hex} should parse`).not.toBeNull()
      const adjusted = adjustColorForLightCanvas(room.hex, 'accent')
      expect(adjusted).not.toBeNull()
      if (adjusted!.toLowerCase() === room.hex.toLowerCase()) {
        unchanged.push(room.name)
        expect(ratio!).toBeGreaterThanOrEqual(LIGHT_ADJUST_BELOW)
      } else {
        changed.push(room.name)
        expect(ratio!).toBeLessThan(LIGHT_ADJUST_BELOW)
        expect(contrastRatio(adjusted!, LIGHT_CANVAS_HEX)!).toBeGreaterThanOrEqual(LIGHT_ACCENT_TARGET - 0.05)
      }
    }
    expect(changed).toEqual(['Cursed ASMR'])
    expect(unchanged).toEqual([
      'The Darkroom',
      'The Weather Station',
      'The Kitchen',
      'The Studio',
      'The Globe',
      'The Lab',
      'The Arcade',
      'The Atelier',
      'The Gym',
      'The Library',
    ])
  })

  it('darkens a hypothetical future neon that falls below the cutoff', () => {
    const neon = '#ffff00'
    expect(contrastRatio(neon, LIGHT_CANVAS_HEX)!).toBeLessThan(LIGHT_ADJUST_BELOW)
    const adjusted = adjustColorForLightCanvas(neon, 'accent')!
    expect(adjusted.toLowerCase()).not.toBe(neon)
    expect(contrastRatio(adjusted, LIGHT_CANVAS_HEX)!).toBeGreaterThanOrEqual(LIGHT_ACCENT_TARGET - 0.05)
  })

  it('returns null for invalid input', () => {
    expect(adjustColorForLightCanvas(null)).toBeNull()
    expect(adjustColorForLightCanvas(undefined)).toBeNull()
    expect(adjustColorForLightCanvas('')).toBeNull()
    expect(adjustColorForLightCanvas('lime')).toBeNull()
    expect(adjustColorForLightCanvas('#gg0000')).toBeNull()
    expect(adjustColorForLightCanvas('#1234')).toBeNull()
    expect(adjustColorForLightCanvas('javascript:alert(1)')).toBeNull()
  })
})

describe('colorForTheme', () => {
  it('leaves stored colors alone in dark mode and when the theme is unresolved', () => {
    expect(colorForTheme(LIME, 'dark')).toBe(LIME)
    expect(colorForTheme(LIME, undefined)).toBe(LIME)
    expect(colorForTheme(LIME, '')).toBe(LIME)
    expect(colorForTheme('#f39c12', 'dark')).toBe('#f39c12')
  })

  it('adjusts only failing colors in light mode', () => {
    expect(colorForTheme(LIME, 'light')).not.toBe(LIME)
    expect(colorForTheme('#f39c12', 'light')).toBe('#f39c12')
    expect(colorForTheme('#e67e22', 'light')).toBe('#e67e22')
    expect(colorForTheme(null, 'light')).toBeNull()
  })
})
