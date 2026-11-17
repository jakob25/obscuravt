import { pageMetadata } from '@/lib/og/page-meta'
import { PAGE_META, SITE_DESCRIPTION } from '@/lib/site-copy'

export const metadata = pageMetadata({ title: PAGE_META.clips.title, description: SITE_DESCRIPTION, path: '/clips' })

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
