/**
 * Initial camera for the Discover maps. Only the starting view is computed here;
 * cluster positions and creator placement are never changed.
 *
 * If every cluster fits within the zoom limits, the camera centres their full
 * visual extent (orb plus label). When the zoom floor stops everything fitting
 * (a phone at 40%), centring the overall bounding box lands on the sparse middle
 * of the map and cuts clusters off at both edges. Instead the camera picks the
 * window that shows the most creators in fully visible clusters, then centres
 * those clusters' extent in the viewport.
 */
export interface MapFitPoint {
  x: number
  y: number
  /** Creators in the cluster; larger clusters matter more when not all fit. */
  weight?: number
  /** Half the label width in screen px (labels keep a fixed screen size). */
  labelHalfWidthPx?: number
}

export interface MapFitOptions {
  /** World-space radius kept around each cluster centre (roughly an orb's radius). */
  pad: number
  minK: number
  maxK: number
  /** Screen-space space kept clear for overlays (map toggle on top, hints at the bottom). */
  insetTop?: number
  insetBottom?: number
  insetX?: number
}

interface Extent { lo: number; hi: number; w: number }

/** Start of the window of length `span` that holds the most weight in whole extents,
 * then shifted so the chosen extents sit centred in it. */
export function bestWindowStart(items: Extent[], span: number): number {
  const allLo = Math.min(...items.map(i => i.lo))
  const allHi = Math.max(...items.map(i => i.hi))
  if (allHi - allLo <= span) return (allLo + allHi) / 2 - span / 2
  const mid = (allLo + allHi) / 2
  const starts = items.flatMap(i => [i.lo, i.hi - span])
  let best: { score: number; dist: number; lo: number; hi: number } | null = null
  for (const s of starts) {
    const inside = items.filter(i => i.lo >= s - 1e-6 && i.hi <= s + span + 1e-6)
    if (!inside.length) continue
    const score = inside.reduce((n, i) => n + i.w, 0)
    const dist = Math.abs(s + span / 2 - mid)
    if (!best || score > best.score || (score === best.score && dist < best.dist)) {
      best = { score, dist, lo: Math.min(...inside.map(i => i.lo)), hi: Math.max(...inside.map(i => i.hi)) }
    }
  }
  if (!best) return mid - span / 2
  return (best.lo + best.hi) / 2 - span / 2
}

export function fitMapTransform(
  points: MapFitPoint[],
  width: number,
  height: number,
  { pad, minK, maxK, insetTop = 0, insetBottom = 0, insetX = 0 }: MapFitOptions,
): { k: number; x: number; y: number } | null {
  if (!points.length || width <= 0 || height <= 0) return null
  const availW = Math.max(1, width - insetX * 2)
  const availH = Math.max(1, height - insetTop - insetBottom)
  // Labels are drawn at a fixed screen size, so their world width depends on k.
  const extents = (k: number) => ({
    xs: points.map(p => {
      const half = Math.max(pad, (p.labelHalfWidthPx ?? 0) / k)
      return { lo: p.x - half, hi: p.x + half, w: p.weight ?? 1 }
    }),
    ys: points.map(p => ({ lo: p.y - pad, hi: p.y + pad, w: p.weight ?? 1 })),
  })
  const sizeAt = (k: number) => {
    const { xs, ys } = extents(k)
    return {
      w: Math.max(...xs.map(i => i.hi)) - Math.min(...xs.map(i => i.lo)),
      h: Math.max(...ys.map(i => i.hi)) - Math.min(...ys.map(i => i.lo)),
    }
  }
  // A couple of passes settle k, since label extents shrink as k grows.
  let k = maxK
  for (let i = 0; i < 4; i++) {
    const { w, h } = sizeAt(k)
    k = Math.min(maxK, Math.max(minK, Math.min(availW / w, availH / h)))
  }
  const { xs, ys } = extents(k)
  const left = bestWindowStart(xs, availW / k)
  const top = bestWindowStart(ys, availH / k)
  return { k, x: insetX - left * k, y: insetTop - top * k }
}
