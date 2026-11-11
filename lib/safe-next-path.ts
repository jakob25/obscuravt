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

/** Read a validated post-login path from a `?next=` query string. */
export function nextPathFromSearch(search: string | null | undefined): string {
  const raw = (search ?? '').replace(/^\?/, '')
  return safeNextPath(new URLSearchParams(raw).get('next'))
}

/**
 * Leave the login screen for the validated `next` path.
 * Uses a document navigation so the session cookie is sent on the next
 * request; a client-only router.push can leave this page mounted.
 */
export function navigateAfterLogin(
  search: string | null | undefined,
  go: (href: string) => void = href => { window.location.assign(href) },
): void {
  go(nextPathFromSearch(search))
}
