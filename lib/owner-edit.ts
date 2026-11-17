import { ownsVtuber } from '@/lib/owns-vtuber'
import { isOwnUploadedAvatar } from '@/lib/avatar-path'

import { OWNER_EDIT_LIMITS } from '@/lib/owner-edit-limits'

/** Owner-editable fields on a creator file: bio and picture only. Nothing else (name, handle, link, tags, claim columns…) is accepted. */
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

export type OwnerEditInput = { bio?: unknown; avatar_url?: unknown }

/** Validate an edit. Bio: the owner's own words, length-limited only. Picture: their own upload. */
export function validateOwnerEdit(
  input: OwnerEditInput,
  username: string,
  supabaseUrl: string,
): { ok: true; updates: { bio?: string; avatar_url?: string } } | { ok: false; error: string } {
  const updates: { bio?: string; avatar_url?: string } = {}
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
  if (Object.keys(updates).length === 0) return { ok: false, error: 'Nothing to save.' }
  return { ok: true, updates }
}
