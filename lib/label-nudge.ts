/**
 * Label-only collision nudge for map cluster labels. Returns a vertical offset per
 * label so no two label boxes overlap; cluster positions and orbs are untouched.
 * Labels are processed top to bottom and a label that would overlap one already
 * placed is pushed just below it.
 */
export interface LabelBox {
  id: string
  x: number
  y: number
  halfWidth: number
  /** Box extends from y - above to y + below before any nudge. */
  above: number
  below: number
}

export function labelNudges(labels: LabelBox[], gap = 0): Map<string, number> {
  const out = new Map<string, number>()
  const placed: { l: number; r: number; t: number; b: number }[] = []
  const sorted = [...labels].sort((a, b) => a.y - b.y || a.x - b.x)
  for (const lb of sorted) {
    const l = lb.x - lb.halfWidth
    const r = lb.x + lb.halfWidth
    let dy = 0
    for (let pass = 0; pass < labels.length; pass++) {
      const t = lb.y - lb.above + dy
      const b = lb.y + lb.below + dy
      const hit = placed.find(p => l < p.r && r > p.l && t < p.b + gap && b > p.t - gap)
      if (!hit) break
      dy = hit.b + gap - (lb.y - lb.above)
    }
    out.set(lb.id, dy)
    placed.push({ l, r, t: lb.y - lb.above + dy, b: lb.y + lb.below + dy })
  }
  return out
}
