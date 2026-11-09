/**
 * Which niche-specific dossier page a niche gets, keyed by niche cluster id
 * (canonical_tags.id where category = 'niche_cluster').
 *
 * - 'world':    world builders' lore and characters.
 * - 'pictures': photo posts (IRL, photography) — not wired yet; needs its
 *               own photo-link storage first.
 *
 * A niche that isn't listed gets no extra page (Profile, Clips, Art only).
 * Adding a niche later is one entry here plus its page, if it's a new kind.
 * Even a listed niche shows its page only when there is real content for it.
 */
export type NichePageKind = 'world' | 'pictures'

export const NICHE_PAGE_BY_CLUSTER: Readonly<Record<string, NichePageKind>> = {
  // Filled in once the owner confirms which niches are which.
}

export function nichePageKindFor(nicheClusterId: string | null | undefined): NichePageKind | null {
  if (!nicheClusterId) return null
  return Object.prototype.hasOwnProperty.call(NICHE_PAGE_BY_CLUSTER, nicheClusterId)
    ? NICHE_PAGE_BY_CLUSTER[nicheClusterId]
    : null
}
