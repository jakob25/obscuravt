import { pageMetadata } from '@/lib/og/page-meta'
import { PAGE_META } from '@/lib/site-copy'

export const metadata = pageMetadata({ title: PAGE_META.nominator.title, description: PAGE_META.nominator.description, path: '/nominator' })

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
