import { caseFileImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og/case-file-card'
import { DISCOVER_MAP_HINT } from '@/lib/site-copy'

export const alt = 'Vibe Map on ObscuraVT'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return caseFileImage({ stamp: 'VIBE MAP', title: 'Vibe Map', lines: [DISCOVER_MAP_HINT.vibe, DISCOVER_MAP_HINT.niche], footer: 'obscuravt.com/discover' })
}
