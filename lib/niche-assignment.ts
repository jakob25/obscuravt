/** A niche cluster as stored in canonical_tags (category = 'niche_cluster'). */
export interface NicheClusterTags {
  id: string
  content_tag_ids: string[] | null
}

/**
 * Assign a creator to a niche cluster, purely from DB-driven data.
 *
 * 1. A niche the creator picked (an nclust_* id on their tags, from the Add
 *    VTuber form) wins, but only if it is one of the live clusters passed in.
 *    Unknown or retired ids are ignored.
 * 2. Otherwise, the cluster whose content tags they match most. Ties keep the
 *    earlier cluster (sort order).
 *
 * Returns null when nothing matches.
 */
export function assignNicheCluster(tags: readonly string[], clusters: readonly NicheClusterTags[]): string | null {
  const liveIds = new Set(clusters.map(cluster => cluster.id))
  const picked = tags.find(tag => tag.startsWith('nclust_') && liveIds.has(tag))
  if (picked) return picked

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
