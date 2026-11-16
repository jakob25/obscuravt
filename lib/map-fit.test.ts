import { describe, expect, it } from 'vitest'
import { bestWindowStart, fitMapTransform, windowScore } from './map-fit'

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
    // Two groups far apart; the group with more populated clusters should be fully on screen.
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

describe('starting view scoring', () => {
  const sx = (f: { k: number; x: number }, x: number) => x * f.k + f.x
  const fullyIn = (f: { k: number; x: number }, x: number) => sx(f, x) - 100 * f.k >= -1e-6 && sx(f, x) + 100 * f.k <= 390 + 1e-6

  it('prefers the most populated clusters over the most creators', () => {
    const f = fitMapTransform([
      { x: 0, y: 0, weight: 1 }, { x: 250, y: 0, weight: 1 }, { x: 500, y: 0, weight: 1 },
      { x: 1600, y: 0, weight: 40 },
    ], 390, 780, opts)!
    expect([0, 250, 500].every(x => fullyIn(f, x))).toBe(true)
  })

  it('on a tie in cluster count, keeps the smallest clusters in view', () => {
    const f = fitMapTransform([
      { x: 0, y: 0, weight: 9 }, { x: 300, y: 0, weight: 8 },
      { x: 1500, y: 0, weight: 1 }, { x: 1800, y: 0, weight: 2 },
    ], 390, 780, opts)!
    expect(fullyIn(f, 1500) && fullyIn(f, 1800)).toBe(true)
  })

  it('ignores empty clusters when choosing the view', () => {
    const f = fitMapTransform([
      { x: 0, y: 0, weight: 0 }, { x: 250, y: 0, weight: 0 }, { x: 500, y: 0, weight: 0 },
      { x: 1600, y: 0, weight: 2 },
    ], 390, 780, opts)!
    expect(fullyIn(f, 1600)).toBe(true)
  })

  it('scores by populated count, then small-cluster bonus, then creators', () => {
    expect(windowScore([{ lo: 0, hi: 1, w: 0 }, { lo: 0, hi: 1, w: 2 }, { lo: 0, hi: 1, w: 4 }])).toEqual([2, 0.75, 6])
  })
})

describe('bestWindowStart', () => {
  it('centres everything when it fits', () => {
    expect(bestWindowStart([{ lo: 0, hi: 100, w: 1 }], 300)).toBe(-100)
  })
})
