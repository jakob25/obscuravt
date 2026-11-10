import { sanitizeText } from '@/lib/validation'
import { formatTagLabel } from '@/lib/tag-label'

/** Suggested niches are stored on vtubers.tags with this prefix until an admin adds a real niche. */
export const NICHE_SUGGEST_PREFIX = 'nsuggest:'
export const CUSTOM_NICHE_MAX_LENGTH = 30
export const CUSTOM_NICHE_MAX_COUNT = 3

export type CanonicalOption = {
  id: string
  name: string
  description: string | null
  color: string | null
}

export type NicheOption = CanonicalOption
export type ClusterOption = CanonicalOption

export function isNicheId(tag: string): boolean {
  return tag.startsWith('nclust_')
}

export function isClusterId(tag: string): boolean {
  return tag.startsWith('clust_')
}

export function isNicheSuggestTag(tag: string): boolean {
  return tag.startsWith(NICHE_SUGGEST_PREFIX)
}

export function nicheSuggestLabel(tag: string): string {
  return isNicheSuggestTag(tag) ? tag.slice(NICHE_SUGGEST_PREFIX.length) : tag
}

export function toNicheSuggestTag(label: string): string {
  return `${NICHE_SUGGEST_PREFIX}${label}`
}

export function sanitizeCustomNiche(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  let value = sanitizeText(raw).replace(/\s+/g, ' ').trim()
  value = value.replace(/[^\p{L}\p{N} '&/-]+/gu, '').replace(/\s+/g, ' ').trim()
  if (value.length > CUSTOM_NICHE_MAX_LENGTH) {
    value = value.slice(0, CUSTOM_NICHE_MAX_LENGTH).trim()
  }
  if (value.length < 2) return null
  return value
}

export function normalizeNicheKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/nclust_/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

export function matchExistingNiche(input: string, niches: readonly NicheOption[]): NicheOption | null {
  const key = normalizeNicheKey(input)
  if (!key) return null
  return niches.find(niche => (
    normalizeNicheKey(niche.name) === key
    || normalizeNicheKey(niche.id) === key
    || niche.id.toLowerCase() === input.trim().toLowerCase()
  )) ?? null
}

function isCloseKey(a: string, b: string): boolean {
  if (!a || !b || a === b) return false
  if (a.includes(b) || b.includes(a)) return true
  if (Math.abs(a.length - b.length) > 3) return false
  return levenshtein(a, b) <= 2
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const grid: number[][] = Array.from({ length: rows }, (_, i) => {
    const row = Array.from({ length: cols }, (__, j) => (i === 0 ? j : 0))
    row[0] = i
    return row
  })
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      grid[i][j] = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + cost)
    }
  }
  return grid[a.length][b.length]
}

export function closeNicheMatches(input: string, niches: readonly NicheOption[]): NicheOption[] {
  if (matchExistingNiche(input, niches)) return []
  const key = normalizeNicheKey(input)
  if (!key || key.length < 2) return []
  return niches.filter(niche => isCloseKey(key, normalizeNicheKey(niche.name)))
}

export function parseNominationTags(tags: string[] | null | undefined) {
  const list = Array.isArray(tags) ? tags : []
  return {
    constellationId: list.find(isClusterId) ?? null,
    nicheId: list.find(isNicheId) ?? null,
    suggestions: list.filter(isNicheSuggestTag),
    other: list.filter(tag => !isClusterId(tag) && !isNicheId(tag) && !isNicheSuggestTag(tag)),
  }
}

export function buildNominationTags(input: {
  constellationId?: string | null
  nicheId?: string | null
  vibeTags?: string[]
  suggestions?: string[]
}): string[] {
  const tags: string[] = []
  if (input.constellationId) tags.push(input.constellationId)
  if (input.nicheId) tags.push(input.nicheId)
  for (const tag of input.vibeTags ?? []) {
    if (tag && !tags.includes(tag)) tags.push(tag)
  }
  for (const label of input.suggestions ?? []) {
    const stored = isNicheSuggestTag(label) ? label : toNicheSuggestTag(label)
    if (!tags.includes(stored)) tags.push(stored)
  }
  return tags
}

export function nicheDisplayName(id: string | null | undefined, niches: readonly NicheOption[] = []): string {
  if (!id) return ''
  const official = niches.find(niche => niche.id === id)
  if (official) return official.name
  if (isNicheSuggestTag(id)) return nicheSuggestLabel(id)
  return formatTagLabel(id)
}

export function describePendingTags(tags: string[] | null | undefined, niches: readonly NicheOption[] = [], clusters: readonly ClusterOption[] = []) {
  const parsed = parseNominationTags(tags)
  return {
    constellationLabel: parsed.constellationId ? nicheDisplayName(parsed.constellationId, clusters) : null,
    nicheLabel: parsed.nicheId ? nicheDisplayName(parsed.nicheId, niches) : null,
    nicheDescription: parsed.nicheId
      ? (niches.find(option => option.id === parsed.nicheId)?.description?.trim() || null)
      : null,
    newCategories: parsed.suggestions.map(nicheSuggestLabel),
    otherLabels: parsed.other.map(tag => formatTagLabel(tag)),
  }
}

export type NominationTagResult =
  | { ok: true; tags: string[] }
  | { ok: false; error: string }

export function validateNominationTags(
  raw: unknown,
  catalogs: { niches: readonly NicheOption[]; clusters: readonly ClusterOption[] },
): NominationTagResult {
  const niches = catalogs.niches
  const clusters = catalogs.clusters
  if (raw == null) return { ok: true, tags: [] }
  if (!Array.isArray(raw)) return { ok: false, error: 'Tags must be an array.' }

  const nicheIds = new Set(niches.map(niche => niche.id))
  const clusterIds = new Set(clusters.map(cluster => cluster.id))
  const officialNames = niches
  let constellationId: string | null = null
  let nicheId: string | null = null
  const vibeTags: string[] = []
  const suggestions: string[] = []

  for (const item of raw) {
    if (typeof item !== 'string') return { ok: false, error: 'Each tag must be text.' }
    const value = item.trim()
    if (!value) continue

    if (isClusterId(value)) {
      if (!clusterIds.has(value)) return { ok: false, error: 'Pick a constellation from the list.' }
      if (constellationId && constellationId !== value) return { ok: false, error: 'Pick a single constellation.' }
      constellationId = value
      continue
    }

    if (isNicheId(value)) {
      if (!nicheIds.has(value)) return { ok: false, error: 'Pick a niche from the list.' }
      if (nicheId && nicheId !== value) return { ok: false, error: 'Pick a single niche.' }
      nicheId = value
      continue
    }

    if (isNicheSuggestTag(value)) {
      const label = sanitizeCustomNiche(nicheSuggestLabel(value))
      if (!label) return { ok: false, error: 'That new category is not valid.' }
      const existing = matchExistingNiche(label, officialNames)
      if (existing) {
        if (nicheId && nicheId !== existing.id) return { ok: false, error: 'Pick a single niche.' }
        nicheId = existing.id
        continue
      }
      if (closeNicheMatches(label, officialNames).length) {
        return { ok: false, error: 'That category is too close to an existing niche. Pick the one on the list.' }
      }
      const stored = toNicheSuggestTag(label)
      if (!suggestions.includes(stored)) suggestions.push(stored)
      continue
    }

    // Vibe, content, and any other existing tags are left as they are.
    if (value.length > 50) return { ok: false, error: 'A tag is too long.' }
    if (!vibeTags.includes(value)) vibeTags.push(value)
  }

  if (suggestions.length > CUSTOM_NICHE_MAX_COUNT) {
    return { ok: false, error: `You can suggest up to ${CUSTOM_NICHE_MAX_COUNT} new categories.` }
  }

  return { ok: true, tags: buildNominationTags({ constellationId, nicheId, vibeTags, suggestions: suggestions.map(nicheSuggestLabel) }) }
}

export type TagRow = {
  id?: string
  tag?: string
  category?: string
  sort_order?: number
  description?: string | null
  color?: string | null
}

export function safeTagColor(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const color = value.trim()
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color) ? color : null
}

export function optionsFromTagRows(
  rows: TagRow[] | null | undefined,
  category: 'niche_cluster' | 'cluster',
): CanonicalOption[] {
  return (rows ?? [])
    .filter(row => row.category === category && row.id && row.tag)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(row => ({
      id: row.id as string,
      name: row.tag as string,
      description: typeof row.description === 'string' && row.description.trim() ? row.description.trim() : null,
      color: safeTagColor(row.color),
    }))
}

export function nichesFromTagRows(rows: TagRow[] | null | undefined): NicheOption[] {
  return optionsFromTagRows(rows, 'niche_cluster')
}

export function clustersFromTagRows(rows: TagRow[] | null | undefined): ClusterOption[] {
  return optionsFromTagRows(rows, 'cluster')
}

export function nicheLeadText(option: CanonicalOption): string {
  return option.description || option.name
}
