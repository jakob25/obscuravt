import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

// Live domain per README ("Live: https://obscuravt.com") and the existing 'obscuravt.com' fallback in lib/embed-utils.ts.
const SITE_URL = 'https://obscuravt.com'

export const revalidate = 86400

// Public pages anyone can open without signing in. /leaderboard stays (fan leaderboard, approved Nov 9).
const PUBLIC_PAGES = [
  '', '/clips', '/search', '/discover', '/schedule', '/leaderboard', '/help', '/resources',
  '/find-my-oshi', '/nominator', '/bets', '/forums', '/weekly', '/fan-art', '/discovery-games',
]

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

  try {
    // Constellation pages (same canonical_tags 'cluster' rows the cluster page pre-renders)
    const { data } = await supabase.from('canonical_tags').select('id').eq('category', 'cluster')
    for (const row of data ?? []) {
      if (row?.id) pages.push({ url: `${SITE_URL}/cluster/${encodeURIComponent(String(row.id))}` })
    }
  } catch {
    // Optional; skip if unavailable.
  }

  return pages
}
