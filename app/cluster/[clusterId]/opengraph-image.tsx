import { caseFileImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og/case-file-card'
import { getClusterShare } from '@/lib/og/cluster-share'
import { DOSSIER } from '@/lib/site-copy'

export const alt = 'ObscuraVT constellation'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const revalidate = 86400

export default async function Image({ params }: { params: Promise<{ clusterId: string }> }) {
  const { clusterId } = await params
  const c = await getClusterShare(clusterId).catch(() => null)
  if (!c) return caseFileImage({ stamp: DOSSIER.onRecord, title: 'ObscuraVT', lines: ['Find VTubers by vibe and tag, not sub count.'] })
  return caseFileImage({
    stamp: DOSSIER.onRecord,
    kicker: `${DOSSIER.filedUnder.toUpperCase()}:`,
    title: c.name,
    lines: [c.description, `${c.creators} creator${c.creators === 1 ? '' : 's'} on file`],
    footer: 'obscuravt.com · Constellations',
  })
}
