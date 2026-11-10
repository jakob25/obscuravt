/**
 * Display-only label for a stored constellation, vibe, or content tag id.
 * Stored values stay unchanged. Uses sentence case, e.g. "Slice of life".
 */
const PREFIX = /^(clust_|vibe_|cont_)/

export function formatTagLabel(id: string): string {
  if (typeof id !== 'string') return ''
  const bare = id.replace(PREFIX, '').replace(/[_-]+/g, ' ').trim()
  if (!bare) return id
  const lower = bare.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}
