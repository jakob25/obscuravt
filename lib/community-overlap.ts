/** Parse comma-separated favorite_vtubers from users table. */
export function parseFavoriteVtubers(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Among fans who follow sourceVtuberId, what % also follow targetVtuberId?
 * Returns 0–100 integer.
 */
export function fanOverlapPercent(
  sourceVtuberId: string,
  targetVtuberId: string,
  users: Array<{ favorite_vtubers: string | null }>,
): number {
  if (sourceVtuberId === targetVtuberId) return 100

  let sourceFans = 0
  let shared = 0

  for (const u of users) {
    const ids = parseFavoriteVtubers(u.favorite_vtubers)
    if (!ids.includes(sourceVtuberId)) continue
    sourceFans++
    if (ids.includes(targetVtuberId)) shared++
  }

  if (sourceFans === 0) return 0
  return Math.round((shared / sourceFans) * 100)
}