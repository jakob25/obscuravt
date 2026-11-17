import type { Metadata } from 'next'
import { siteOrigin } from '@/lib/vtuber-share-meta'

/**
 * Per-route title/description + Open Graph/Twitter tags. Share images come from each
 * route's opengraph-image file (or `image` when a route needs a query-dependent card).
 */
export function pageMetadata({ title, description, path, image }: { title: string; description?: string; path: string; image?: string }): Metadata {
  return {
    metadataBase: new URL(siteOrigin()),
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: 'ObscuraVT', type: 'website', ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}) },
    twitter: { card: 'summary_large_image', title, description, ...(image ? { images: [image] } : {}) },
  }
}
