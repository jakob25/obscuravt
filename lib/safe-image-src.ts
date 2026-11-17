/**
 * Picture src for user-supplied images: only a local file preview (blob:) or an https: link
 * is allowed; anything else (javascript:, data:, relative junk) gives null so nothing renders.
 */
export function safeImageSrc(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'blob:' && url.protocol !== 'https:') return null
  return url.href
}
