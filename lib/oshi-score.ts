/** Score Find My Oshi quiz answers against mapped VTuber tags. */
export function scoreVTubers<T extends { category: string; vibeTags: string[] }>(
  answers: string[][],
  vtubers: T[],
): T[] {
  const weights: Record<string, number> = {}
  answers.flat().forEach(tag => {
    weights[tag] = (weights[tag] ?? 0) + 1
  })

  return vtubers
    .map(v => {
      const allTags = [v.category, ...v.vibeTags]
      const score = allTags.reduce((s, tag) => s + (weights[tag] ?? 0), 0)
      return { vtuber: v, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.vtuber)
}
