/**
 * Initial camera for the Discover maps: centre all cluster positions in the
 * visible canvas and zoom out (within the map's zoom limits) so as many as
 * possible fit. Only the starting view is computed here; cluster positions and
 * creator placement are never changed.
 */
export interface MapFitOptions {
  /** World-space padding around each cluster centre (roughly an orb's radius). */
  pad: number
  minK: number
  maxK: number
  /** Screen-space space kept clear for overlays (map toggle on top, hints at the bottom). */
  insetTop?: number
  insetBottom?: number
  insetX?: number
}

export function fitMapTransform(
  points: { x: number; y: number }[],
  width: number,
  height: number,
  { pad, minK, maxK, insetTop = 0, insetBottom = 0, insetX = 0 }: MapFitOptions,
): { k: number; x: number; y: number } | null {
  if (!points.length || width <= 0 || height <= 0) return null
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs) - pad
  const maxX = Math.max(...xs) + pad
  const minY = Math.min(...ys) - pad
  const maxY = Math.max(...ys) + pad
  const availW = Math.max(1, width - insetX * 2)
  const availH = Math.max(1, height - insetTop - insetBottom)
  const fitK = Math.min(availW / (maxX - minX), availH / (maxY - minY))
  const k = Math.min(maxK, Math.max(minK, fitK))
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  return { k, x: insetX + availW / 2 - cx * k, y: insetTop + availH / 2 - cy * k }
}
