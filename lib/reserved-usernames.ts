/** Usernames that must not be registered or chosen later. Compare with normalizeUsernameForCompare. */
export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'jakob25',
  'root',
  'mod',
  'moderator',
  'system',
  'staff',
  'support',
  'obscuravt',
] as const

export const RESERVED_USERNAME_ERROR = 'That username is reserved'

/** Ignore case and all whitespace when comparing reserved usernames. */
export function normalizeUsernameForCompare(username: string): string {
  return username.replace(/\s+/g, '').toLowerCase()
}

export function isReservedUsername(username: string | null | undefined): boolean {
  if (!username) return false
  const needle = normalizeUsernameForCompare(username)
  if (!needle) return false
  return RESERVED_USERNAMES.some(name => name === needle)
}
