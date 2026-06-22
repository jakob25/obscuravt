/**
 * Vibe match % = Jaccard similarity on vibe tag sets:
 * |A ∩ B| ÷ |A ∪ B|
 */
export function jaccardSimilarity(tagsA: string[], tagsB: string[]): number {
  const a = new Set(tagsA.filter(Boolean))
  const b = new Set(tagsB.filter(Boolean))
  if (a.size === 0 && b.size === 0) return 0
  let intersection = 0
  for (const t of a) {
    if (b.has(t)) intersection++
  }
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

export function matchPercent(tagsA: string[], tagsB: string[]): number {
  return Math.round(jaccardSimilarity(tagsA, tagsB) * 100)
}