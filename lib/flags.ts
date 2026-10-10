/**
 * Vercel project flag for guest clip submit.
 * On by default. Set GUEST_CLIP_SUBMIT=0 (or false/off) to require a session.
 * Flip it in Vercel project settings, then redeploy so the function picks it up.
 */
export function allowSignedOutClipSubmit(): boolean {
  const raw = (process.env.GUEST_CLIP_SUBMIT ?? '').trim().toLowerCase()
  if (raw === '0' || raw === 'false' || raw === 'off') return false
  return true
}
