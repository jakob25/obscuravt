export interface DiscoveryPrize {
  id: string
  name: string
  avatarUrl: string
  silhouetteUrl: string | null
  category: string
  bio: string
  source: 'uploaded' | 'avatar_fallback'
}

export function dicebearAvatar(id: string): string {
  return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(id)}&backgroundColor=d4a574`
}

export function resolveAvatarUrl(id: string, avatarUrl: string | null | undefined): string {
  return avatarUrl?.trim() || dicebearAvatar(id)
}

export function resolveSilhouetteDisplay(
  id: string,
  silhouetteUrl: string | null | undefined,
  avatarUrl: string | null | undefined,
): { url: string; source: 'uploaded' | 'avatar_fallback' } {
  if (silhouetteUrl?.trim()) {
    return { url: silhouetteUrl.trim(), source: 'uploaded' }
  }
  return { url: resolveAvatarUrl(id, avatarUrl), source: 'avatar_fallback' }
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}