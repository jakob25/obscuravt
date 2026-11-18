import { caseFileImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og/case-file-card'
import { getProducer } from '@/lib/producers-server'
import { producerAvatar, producerServices } from '@/lib/producers'
import { PRODUCERS } from '@/lib/site-copy'

export const alt = 'ObscuraVT producer file'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const revalidate = 86400

/** Producer share card: the same case-file card, stamped PRODUCER FILE. Real fields only. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const producer = await getProducer(id)
  if (!producer) {
    return caseFileImage({ stamp: PRODUCERS.stamp, title: PRODUCERS.section, lines: [PRODUCERS.shareTagline], footer: `obscuravt.com · ${PRODUCERS.section}` })
  }
  const services = producerServices(producer).map(s => PRODUCERS.services[s]).join(' · ')
  const sound = (producer.genre_tags ?? []).slice(0, 4).join(' · ')
  return caseFileImage({
    stamp: PRODUCERS.stamp,
    kicker: `${PRODUCERS.name.toUpperCase()}:`,
    title: producer.name,
    lines: [
      sound ? `${PRODUCERS.soundProfile}: ${sound}` : null,
      services || null,
    ],
    avatarUrl: producerAvatar(producer),
    footer: `obscuravt.com · ${PRODUCERS.section}`,
  })
}
