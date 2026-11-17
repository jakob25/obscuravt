import { caseFileImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og/case-file-card'
import { PAGE_META } from '@/lib/site-copy'

export const alt = 'Nominate a VTuber on ObscuraVT'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return caseFileImage({ stamp: 'NOMINATION', title: 'Nominate a VTuber', lines: [PAGE_META.nominator.description], footer: 'obscuravt.com/nominator' })
}
