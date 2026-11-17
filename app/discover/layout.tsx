import { WhatsHere } from '@/components/common/whats-here'
import { pageMetadata } from '@/lib/og/page-meta'
import { PAGE_META, SITE_DESCRIPTION } from '@/lib/site-copy'

export const metadata = pageMetadata({ title: PAGE_META.discover.title, description: SITE_DESCRIPTION, path: '/discover' })

export const revalidate = 300

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <noscript>
        <WhatsHere />
      </noscript>
    </>
  )
}
