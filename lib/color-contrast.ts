/**
 * Light-mode contrast helper for room (and other tag) colors.
 *
 * Stored canonical colors are never rewritten. In light mode, a color is
 * darkened only when its contrast against the light page canvas is below
 * LIGHT_ADJUST_BELOW. That cutoff is set so that, of the 11 live niche-room
 * colors, only Cursed ASMR lime (#39ff14) is adjusted; every other current
 * room color is returned unchanged. Colors that do qualify are darkened in
 * OKLCH (lightness only) until they meet the role's target contrast.
 */

/** `html.light --vault-deep`, the light page canvas. */
export const LIGHT_CANVAS_HEX = '#f4efe2'

/**
 * Contrast ratio (WCAG 2) below which a color is rewritten on the light canvas.
 * Cursed ASMR lime (#39ff14) is ~1.18:1; the next-brightest live room,
 * The Arcade (#f39c12), is ~1.91:1.
 */
export const LIGHT_ADJUST_BELOW = 1.5

/** Target contrast once a color has been selected for adjustment (UI accents, borders, dots). */
export const LIGHT_ACCENT_TARGET = 3

/** Target contrast for color used as text. */
export const LIGHT_TEXT_TARGET = 4.5

export type ContrastRole = 'accent' | 'text'

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export type ParsedColor = {
  /** Trimmed original string. */
  raw: string
  r: number
  g: number
  b: number
  alpha: number | null
}

export function parseHexColor(value: string | null | undefined): ParsedColor | null {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!HEX_RE.test(raw)) return null
  let hex = raw.slice(1)
  if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : null
  return { raw, r, g, b, alpha }
}

function srgbChannelToLinear(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function linearToSrgbChannel(c: number): number {
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, s)) * 255)
}

export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbChannelToLinear(r) + 0.7152 * srgbChannelToLinear(g) + 0.0722 * srgbChannelToLinear(b)
}

export function contrastRatio(foreground: string, background: string = LIGHT_CANVAS_HEX): number | null {
  const fg = parseHexColor(foreground)
  const bg = parseHexColor(background)
  if (!fg || !bg) return null
  const l1 = relativeLuminance(fg.r, fg.g, fg.b)
  const l2 = relativeLuminance(bg.r, bg.g, bg.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function linearToOklab(lr: number, lg: number, lb: number) {
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  }
}

function oklabToLinear(L: number, a: number, b: number) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_
  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  }
}

function toHex(r: number, g: number, b: number, alpha: number | null): string {
  const h = (n: number) => linearToSrgbChannel(n).toString(16).padStart(2, '0')
  // linearToSrgbChannel expects linear 0-1, but we're passing linear from oklabToLinear
  const hex = `#${h(r)}${h(g)}${h(b)}`
  if (alpha == null) return hex
  return hex + Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, '0')
}

function parsedToLinear(c: ParsedColor) {
  return {
    r: srgbChannelToLinear(c.r),
    g: srgbChannelToLinear(c.g),
    b: srgbChannelToLinear(c.b),
  }
}

function targetFor(role: ContrastRole): number {
  return role === 'text' ? LIGHT_TEXT_TARGET : LIGHT_ACCENT_TARGET
}

/**
 * In light mode, darken a color if it is too bright against the page canvas.
 * Returns the original trimmed string when no adjustment is needed, or null
 * when the input is not a hex color.
 */
export function adjustColorForLightCanvas(
  color: string | null | undefined,
  role: ContrastRole = 'accent',
  background: string = LIGHT_CANVAS_HEX,
): string | null {
  const parsed = parseHexColor(color)
  if (!parsed) return null
  const ratio = contrastRatio(parsed.raw, background)
  if (ratio == null) return null
  if (ratio >= LIGHT_ADJUST_BELOW) return parsed.raw

  const lin = parsedToLinear(parsed)
  const lab = linearToOklab(lin.r, lin.g, lin.b)
  const bg = parseHexColor(background)
  if (!bg) return parsed.raw
  const bgLum = relativeLuminance(bg.r, bg.g, bg.b)
  const target = targetFor(role)

  const contrastAt = (L: number) => {
    const rgb = oklabToLinear(L, lab.a, lab.b)
    const lum = relativeLuminance(
      linearToSrgbChannel(rgb.r),
      linearToSrgbChannel(rgb.g),
      linearToSrgbChannel(rgb.b),
    )
    const lighter = Math.max(lum, bgLum)
    const darker = Math.min(lum, bgLum)
    return (lighter + 0.05) / (darker + 0.05)
  }

  let lo = 0
  let hi = lab.L
  let best = lo
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (contrastAt(mid) >= target) {
      best = mid
      lo = mid
    } else {
      hi = mid
    }
  }
  // The search keeps the highest L that still meets the target (least darkening).
  // If even L=0 fails, use the darkest available.
  if (contrastAt(best) < target) best = 0

  const out = oklabToLinear(best, lab.a, lab.b)
  return toHex(out.r, out.g, out.b, parsed.alpha)
}

/**
 * Pick the color to render for the current theme. Dark mode (and unresolved
 * theme) always uses the stored color. Light mode may darken it.
 */
export function colorForTheme(
  color: string | null | undefined,
  theme: string | undefined,
  role: ContrastRole = 'accent',
): string | null {
  const parsed = parseHexColor(color)
  if (!parsed) return null
  if (theme !== 'light') return parsed.raw
  return adjustColorForLightCanvas(parsed.raw, role) ?? parsed.raw
}
