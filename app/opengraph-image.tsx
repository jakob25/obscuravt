import { caseFileImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og/case-file-card'
import { DOSSIER, HOME_SHARE_LINE, SITE_TAGLINE } from '@/lib/site-copy'

export const alt = 'ObscuraVT — find VTubers by vibe and tag, not sub count'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/** Site-wide default card (homepage and any page without its own). */
export default async function Image() {
  return caseFileImage({ stamp: DOSSIER.archiveTab.toUpperCase(), title: HOME_SHARE_LINE, lines: [SITE_TAGLINE], footer: 'obscuravt.com' })
}
