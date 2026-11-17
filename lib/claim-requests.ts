/** Shared rules for site claim requests (rows in the existing profile_claim_requests table). */
export const CLAIM_REQUEST_LIMITS = { proofLink: 300, message: 500 } as const

export function cleanProofLink(raw: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null || (typeof raw === 'string' && !raw.trim())) return { ok: true, value: null }
  if (typeof raw !== 'string') return { ok: false, error: 'Proof link must be a web link.' }
  const v = raw.trim()
  if (v.length > CLAIM_REQUEST_LIMITS.proofLink) return { ok: false, error: 'Proof link is too long.' }
  try {
    const u = new URL(v)
    if (u.protocol !== 'https:') return { ok: false, error: 'Use an https:// link.' }
  } catch {
    return { ok: false, error: "That proof link doesn't look like a web link." }
  }
  return { ok: true, value: v }
}

export function cleanMessage(raw: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null) return { ok: true, value: null }
  if (typeof raw !== 'string') return { ok: false, error: 'Message must be text.' }
  const v = raw.trim()
  if (v.length > CLAIM_REQUEST_LIMITS.message) return { ok: false, error: `Keep the message under ${CLAIM_REQUEST_LIMITS.message} characters.` }
  return { ok: true, value: v || null }
}
