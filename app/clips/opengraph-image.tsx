import { caseFileImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og/case-file-card'
import { SITE_TAGLINE } from '@/lib/site-copy'

export const alt = 'Raw Clips on ObscuraVT'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return caseFileImage({ stamp: 'RAW CLIPS', title: 'Raw Clips', lines: ['Every clip links back to the creator.', SITE_TAGLINE], footer: 'obscuravt.com/clips' })
}
