/**
 * Vercel project flag for guest clip submit.
 * Off unless GUEST_CLIP_SUBMIT is 1, true, or on.
 * Unset, 0, false, and off all require a session.
 * Flip it in Vercel project settings, then redeploy so the function picks it up.
 */
export function allowSignedOutClipSubmit(): boolean {
  const raw = (process.env.GUEST_CLIP_SUBMIT ?? '').trim().toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'on'
}
