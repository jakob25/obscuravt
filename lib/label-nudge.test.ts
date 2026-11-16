import { describe, expect, it } from 'vitest'
import { labelNudges } from './label-nudge'

const box = (id: string, x: number, y: number) => ({ id, x, y, halfWidth: 50, above: 10, below: 10 })

describe('labelNudges', () => {
  it('leaves separate labels where they are', () => {
    const n = labelNudges([box('a', 0, 0), box('b', 300, 0), box('c', 0, 100)])
    expect([...n.values()]).toEqual([0, 0, 0])
  })

  it('pushes the lower of two overlapping labels just below the upper one', () => {
    const n = labelNudges([box('low', 20, 12), box('up', 0, 0)], 2)
    expect(n.get('up')).toBe(0)
    expect(n.get('low')).toBe(10 + 2 - (12 - 10))
  })

  it('keeps pushing past a chain of labels', () => {
    const n = labelNudges([box('a', 0, 0), box('b', 0, 5), box('c', 0, 10)])
    expect(n.get('b')).toBe(15)
    expect(n.get('c')).toBe(30)
  })
})
