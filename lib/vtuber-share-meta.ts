import { cache } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { withYoutubeAvatars } from '@/lib/youtube-avatar'

/** Absolute site origin for link previews: the live domain on production, else this deployment's host. */
export function siteOrigin(): string {
  if (process.env.VERCEL_ENV === 'production') return 'https://obscuravt.com'
  const host = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL
  return host ? `https://${host}` : 'http://localhost:3000'
}

/** Read-only, approved-only profile fields for previews (same row the page loads). */
export const getShareProfile = cache(async (id: string) => {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data } = await supabase
    .from('vtubers')
    .select('id,name,bio,avatar_url,platform,link,handle')
    .eq('id', id)
    .eq('approved', true)
    .maybeSingle()
  if (!data) return null
  if (!(data.avatar_url && String(data.avatar_url).trim())) {
    const [withYt] = await withYoutubeAvatars([data])
    return withYt
  }
  return data
})

export function shareDescription(name: string, bio: unknown): string {
  const text = typeof bio === 'string' ? bio.replace(/\s+/g, ' ').trim() : ''
  if (!text) return `Discover ${name} on ObscuraVT`
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text
}
