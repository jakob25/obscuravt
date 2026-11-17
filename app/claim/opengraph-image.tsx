import { caseFileImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og/case-file-card'
import { CLAIM_PAGE, DOSSIER } from '@/lib/site-copy'

export const alt = 'Claim your file on ObscuraVT'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return caseFileImage({ stamp: DOSSIER.onRecord, title: CLAIM_PAGE.title, lines: [...CLAIM_PAGE.body], footer: 'obscuravt.com/claim' })
}
