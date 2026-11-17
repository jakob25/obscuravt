import { getShareProfile } from '@/lib/vtuber-share-meta'
import { ALLOWED_HOSTS, isAllowedHttpsUrl } from '@/lib/safe-fetch'
import { caseFileImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og/case-file-card'
import { clusterNameFor } from '@/lib/og/cluster-name'
import { DOSSIER } from '@/lib/site-copy'

export const alt = 'ObscuraVT creator file'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const revalidate = 86400

/** Dossier share card: real name, constellation, platform and claim state only. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getShareProfile(id)
  if (!profile) {
    return caseFileImage({ stamp: DOSSIER.onRecord, title: 'ObscuraVT', lines: ['Find VTubers by vibe and tag, not sub count.'] })
  }
  const name = String(profile.name ?? 'ObscuraVT')
  const rawAvatar = profile.avatar_url ? String(profile.avatar_url).trim() : ''
  // Only load a picture from an already-allowed host; otherwise text-only.
  const avatar = rawAvatar && isAllowedHttpsUrl(rawAvatar, ALLOWED_HOSTS.avatar) ? rawAvatar : null
  const cluster = await clusterNameFor(profile.tags).catch(() => null)
  const platform = profile.platform ? String(profile.platform).trim() : ''
  const filed = [cluster, platform].filter(Boolean).join(' · ')
  return caseFileImage({
    stamp: DOSSIER.onRecord,
    kicker: `${DOSSIER.codename.toUpperCase()}:`,
    title: name,
    lines: [filed ? `${DOSSIER.filedUnder.toUpperCase()}: ${filed}` : null],
    corner: profile.claimed_by ? DOSSIER.claimed : DOSSIER.unclaimed,
    avatarUrl: avatar,
  })
}
