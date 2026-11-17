import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { ProducerFile } from '@/components/producer/producer-file'
import { pageMetadata } from '@/lib/og/page-meta'
import { creditsForProducer, getProducer } from '@/lib/producers-server'
import { shareDescription } from '@/lib/vtuber-share-meta'
import { PRODUCERS } from '@/lib/site-copy'

export const revalidate = 300

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const producer = await getProducer(id)
  if (!producer) return {}
  return pageMetadata({
    title: `${producer.name} · ${PRODUCERS.section} · ObscuraVT`,
    description: shareDescription(producer.name, producer.bio),
    path: `/producer/${encodeURIComponent(producer.id)}`,
  })
}

export default async function ProducerPage({ params }: Props) {
  const { id } = await params
  const producer = await getProducer(id)
  if (!producer) notFound()
  const credits = await creditsForProducer(producer.id)

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-3 sm:px-5 py-6 max-w-[1320px]">
        <PageBackNav fallbackHref="/producers" label={PRODUCERS.backToBooth} className="mb-6" />
        <ProducerFile producer={producer} credits={credits} />
      </div>
    </div>
  )
}
