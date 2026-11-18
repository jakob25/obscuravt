import PulseFeed from '@/components/landing/pulse-feed'
import { pageMetadata } from '@/lib/og/page-meta'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site-copy'

export const metadata = pageMetadata({ title: `${SITE_NAME} — Pulse`, description: SITE_DESCRIPTION, path: '/pulse' })

// Same feed as the homepage. The old page was a separate query with no thumbnails.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function PulsePage() {
  return <PulseFeed />
}
