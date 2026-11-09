/** A niche cluster as stored in canonical_tags (category = 'niche_cluster'). */
export interface NicheClusterTags {
  id: string
  content_tag_ids: string[] | null
}

/**
 * Assign a creator to the niche cluster whose content tags they match most,
 * purely from DB-driven mappings. Ties keep the earlier cluster (sort order).
 * Returns null when nothing matches.
 */
export function assignNicheCluster(tags: readonly string[], clusters: readonly NicheClusterTags[]): string | null {
  let bestCluster: string | null = null
  let bestScore = 0
  for (const cluster of clusters) {
    const score = (cluster.content_tag_ids ?? []).filter(tag => tags.includes(tag)).length
    if (score > bestScore) {
      bestScore = score
      bestCluster = cluster.id
    }
  }
  return bestCluster
}
