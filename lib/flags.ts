/**
 * Vercel project flag for guest clip submit.
 * Set GUEST_CLIP_SUBMIT=1 in the project env to allow submit while signed out.
 * Unset or 0 keeps the current rule: a session is required.
 * Flip it in Vercel project settings, then redeploy so the function picks it up.
 */
export function allowSignedOutClipSubmit(): boolean {
  const raw = (process.env.GUEST_CLIP_SUBMIT ?? '').trim().toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'on'
}
