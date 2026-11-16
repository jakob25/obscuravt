import { describe, expect, it } from 'vitest'
import { bestWindowStart, fitMapTransform } from './map-fit'

const opts = { pad: 100, minK: 0.4, maxK: 1 }

describe('fitMapTransform', () => {
  it('returns null without clusters', () => {
    expect(fitMapTransform([], 390, 780, opts)).toBeNull()
  })

  it('centres the cluster extent in the visible area when everything fits', () => {
    const pts = [{ x: 0, y: 0 }, { x: 400, y: 200 }]
    const f = fitMapTransform(pts, 1200, 800, { ...opts, insetTop: 60 })!
    expect(200 * f.k + f.x).toBeCloseTo(600)
    expect(100 * f.k + f.y).toBeCloseTo(60 + (800 - 60) / 2)
  })

  it('never zooms in beyond the maximum when clusters are close together', () => {
    const f = fitMapTransform([{ x: 0, y: 0 }], 1200, 800, opts)!
    expect(f.k).toBe(1)
    expect(f.x).toBeCloseTo(600)
    expect(f.y).toBeCloseTo(400)
  })

  it('at the zoom floor, shows whole clusters instead of the empty middle', () => {
    // Two groups far apart; the bigger group (by creators) should be fully on screen.
    const pts = [
      { x: 100, y: 500, weight: 8 }, { x: 300, y: 600, weight: 7 },
      { x: 1600, y: 500, weight: 3 },
    ]
    const f = fitMapTransform(pts, 390, 780, opts)!
    expect(f.k).toBe(0.4)
    const sx = (x: number) => x * f.k + f.x
    expect(sx(100) - 100 * f.k).toBeGreaterThanOrEqual(0)
    expect(sx(300) + 100 * f.k).toBeLessThanOrEqual(390)
    // and those clusters are centred
    expect((sx(100) + sx(300)) / 2).toBeCloseTo(195)
  })

  it('accounts for label width so long names are not clipped', () => {
    const f = fitMapTransform([{ x: 0, y: 0, labelHalfWidthPx: 150 }, { x: 600, y: 0 }], 390, 780, opts)!
    expect(0 * f.k + f.x - 150).toBeGreaterThanOrEqual(-1e-6)
  })
})

describe('bestWindowStart', () => {
  it('centres everything when it fits', () => {
    expect(bestWindowStart([{ lo: 0, hi: 100, w: 1 }], 300)).toBe(-100)
  })
})
