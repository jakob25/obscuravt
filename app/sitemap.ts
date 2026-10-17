import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

// Live domain per README ("Live: https://obscuravt.com") and the existing 'obscuravt.com' fallback in lib/embed-utils.ts.
const SITE_URL = 'https://obscuravt.com'

export const revalidate = 86400

const PUBLIC_PAGES = ['', '/clips', '/search', '/discover', '/schedule', '/leaderboard', '/help', '/resources']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = PUBLIC_PAGES.map(path => ({ url: `${SITE_URL}${path}` }))

  try {
    // Read-only, same approved-only filter as the profile page.
    const { data } = await supabase.from('vtubers').select('id').eq('approved', true)
    for (const row of data ?? []) {
      if (row?.id) pages.push({ url: `${SITE_URL}/vtuber/${encodeURIComponent(String(row.id))}` })
    }
  } catch {
    // Keep the static pages if the database is unreachable.
  }

  return pages
}
