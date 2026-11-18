import { ownsVtuber } from '@/lib/owns-vtuber'
import { isOwnUploadedAvatar } from '@/lib/avatar-path'

import { OWNER_EDIT_LIMITS } from '@/lib/owner-edit-limits'

/** Owner-editable fields: bio, picture, channel link, handle, tags. Name and claim columns stay locked. */
export { OWNER_EDIT_LIMITS }

export interface OwnerEditRow {
  claimed_by: string | null
  claim_approved_at: string | null
}

/**
 * Same ownership check the schedule / Q&A owner features use (ownsVtuber), plus the row must
 * name this user in claimed_by with an approved claim (claim_approved_at set).
 */
export async function canEditOwnFile(username: string, vtuberId: string, row: OwnerEditRow | null): Promise<boolean> {
  if (!row || !username) return false
  if (row.claimed_by !== username || !row.claim_approved_at) return false
  return ownsVtuber(username, vtuberId)
}

export type OwnerEditInput = {
  bio?: unknown
  avatar_url?: unknown
  link?: unknown
  handle?: unknown
  tags?: unknown
}

export type OwnerEditUpdates = {
  bio?: string
  avatar_url?: string
  link?: string | null
  handle?: string | null
  tags?: string[]
}

/** Cluster tags (clust_*) are system-assigned. Owners cannot type or remove them. */
export function isClusterTag(tag: string): boolean {
  return tag.startsWith('clust_')
}

function cleanHandle(raw: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null || (typeof raw === 'string' && !raw.trim())) return { ok: true, value: null }
  if (typeof raw !== 'string') return { ok: false, error: 'Handle must be text.' }
  const v = raw.trim().replace(/^@+/, '')
  if (v.length > OWNER_EDIT_LIMITS.handle) return { ok: false, error: `Keep the handle under ${OWNER_EDIT_LIMITS.handle} characters.` }
  if (!/^[A-Za-z0-9_-]+$/.test(v)) return { ok: false, error: 'Handle can only use letters, numbers, _ and -.' }
  return { ok: true, value: v }
}

function cleanLink(raw: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null || (typeof raw === 'string' && !raw.trim())) return { ok: true, value: null }
  if (typeof raw !== 'string') return { ok: false, error: 'Channel link must be a web link.' }
  const v = raw.trim()
  if (v.length > OWNER_EDIT_LIMITS.link) return { ok: false, error: 'Channel link is too long.' }
  try {
    const u = new URL(v)
    if (u.protocol !== 'https:') return { ok: false, error: 'Use an https:// link.' }
  } catch {
    return { ok: false, error: "That doesn't look like a web link." }
  }
  return { ok: true, value: v }
}

function cleanTags(raw: unknown): { ok: true; value: string[] } | { ok: false; error: string } {
  if (raw == null) return { ok: true, value: [] }
  if (!Array.isArray(raw)) return { ok: false, error: 'Tags must be a list.' }
  const tags = raw
    .filter((t): t is string => typeof t === 'string')
    .map(t => t.trim())
    .filter(Boolean)
    .filter(t => !isClusterTag(t))
  if (tags.length > OWNER_EDIT_LIMITS.tags) return { ok: false, error: `Keep tags to ${OWNER_EDIT_LIMITS.tags} or fewer.` }
  if (tags.some(t => t.length > OWNER_EDIT_LIMITS.tagLength)) return { ok: false, error: `Each tag must be under ${OWNER_EDIT_LIMITS.tagLength} characters.` }
  return { ok: true, value: [...new Set(tags)] }
}

/** Validate an edit. Bio, link, handle, tags. Picture: their own upload. Cluster tags are stripped. */
export function validateOwnerEdit(
  input: OwnerEditInput,
  username: string,
  supabaseUrl: string,
): { ok: true; updates: OwnerEditUpdates } | { ok: false; error: string } {
  const updates: OwnerEditUpdates = {}
  if (input.bio !== undefined) {
    if (typeof input.bio !== 'string') return { ok: false, error: 'Bio must be text.' }
    const bio = input.bio.trim()
    if (bio.length > OWNER_EDIT_LIMITS.bio) return { ok: false, error: `Keep your bio under ${OWNER_EDIT_LIMITS.bio} characters.` }
    updates.bio = bio
  }
  if (input.avatar_url !== undefined) {
    if (typeof input.avatar_url !== 'string' || !isOwnUploadedAvatar(input.avatar_url, username, supabaseUrl)) {
      return { ok: false, error: 'Upload the picture here first, then save.' }
    }
    updates.avatar_url = input.avatar_url
  }
  if (input.link !== undefined) {
    const link = cleanLink(input.link)
    if (!link.ok) return link
    updates.link = link.value
  }
  if (input.handle !== undefined) {
    const handle = cleanHandle(input.handle)
    if (!handle.ok) return handle
    updates.handle = handle.value
  }
  if (input.tags !== undefined) {
    const tags = cleanTags(input.tags)
    if (!tags.ok) return tags
    updates.tags = tags.value
  }
  if (Object.keys(updates).length === 0) return { ok: false, error: 'Nothing to save.' }
  return { ok: true, updates }
}
