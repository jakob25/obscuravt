import { describe, expect, it } from 'vitest'
import { fitMapTransform } from './map-fit'

const opts = { pad: 100, minK: 0.4, maxK: 1 }

describe('fitMapTransform', () => {
  it('returns null without clusters', () => {
    expect(fitMapTransform([], 390, 780, opts)).toBeNull()
  })

  it('centres the cluster bounds in the visible area', () => {
    const pts = [{ x: 0, y: 0 }, { x: 400, y: 200 }]
    const f = fitMapTransform(pts, 1200, 800, { ...opts, insetTop: 60 })!
    const mid = { x: 200 * f.k + f.x, y: 100 * f.k + f.y }
    expect(mid.x).toBeCloseTo(600)
    expect(mid.y).toBeCloseTo(60 + (800 - 60) / 2)
  })

  it('zooms out to fit on a phone but never past the minimum zoom', () => {
    const pts = [{ x: 83, y: 124 }, { x: 1645, y: 1278 }]
    const f = fitMapTransform(pts, 390, 780, opts)!
    expect(f.k).toBe(0.4)
  })

  it('never zooms in beyond the maximum when clusters are close together', () => {
    const f = fitMapTransform([{ x: 0, y: 0 }], 1200, 800, opts)!
    expect(f.k).toBe(1)
    expect(f.x).toBeCloseTo(600)
    expect(f.y).toBeCloseTo(400)
  })
})
