import type { MetadataRoute } from 'next'

// Live domain per README ("Live: https://obscuravt.com") and the existing 'obscuravt.com' fallback in lib/embed-utils.ts.
const SITE_URL = 'https://obscuravt.com'

export default function robots(): MetadataRoute.Robots {
  // Only production gets indexed; staging and preview deployments stay out of search engines.
  if (process.env.VERCEL_ENV !== 'production') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
