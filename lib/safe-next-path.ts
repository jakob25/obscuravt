/**
 * Allow only a same-origin relative path for post-login redirects.
 * Rejects protocol-relative, external, and backslash-smuggled URLs.
 */
export function safeNextPath(raw: string | null | undefined, fallback = '/'): string {
  if (typeof raw !== 'string') return fallback
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/')) return fallback
  if (trimmed.startsWith('//') || trimmed.includes('\\')) return fallback
  if (trimmed.includes('://')) return fallback
  if (/\s/.test(trimmed)) return fallback
  return trimmed
}
