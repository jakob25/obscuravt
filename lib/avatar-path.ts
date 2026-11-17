/** Storage bucket and per-user folder for creator pictures uploaded through /api/vtubers/avatar. */
export const VTUBER_AVATAR_BUCKET = 'vtuber-avatars'

export function avatarFolder(username: string): string {
  return username.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'user'
}

/**
 * True when url is a public file this user uploaded through /api/vtubers/avatar (so it
 * passed that route's type/size checks). Anything else — outside hosts, other people's
 * uploads — is refused.
 */
export function isOwnUploadedAvatar(url: string, username: string, supabaseUrl: string): boolean {
  const base = supabaseUrl.trim().replace(/\/+$/, '')
  if (!base || typeof url !== 'string') return false
  const prefix = `${base}/storage/v1/object/public/${VTUBER_AVATAR_BUCKET}/${avatarFolder(username)}/`
  if (!url.startsWith(prefix)) return false
  const rest = url.slice(prefix.length)
  return /^[A-Za-z0-9._-]+\.(jpg|png|gif|webp)$/.test(rest)
}
