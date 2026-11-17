import { cache } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

/** Constellation name, description and approved creator count for share previews. */
export const getClusterShare = cache(async (clusterId: string) => {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const [{ data: row }, { count }] = await Promise.all([
    supabase.from('canonical_tags').select('id, tag, description').eq('id', clusterId).eq('category', 'cluster').maybeSingle(),
    supabase.from('vtubers').select('id', { count: 'exact', head: true }).eq('approved', true).contains('tags', [clusterId]),
  ])
  if (!row?.tag) return null
  return { id: String(row.id), name: String(row.tag), description: row.description ? String(row.description) : null, creators: count ?? 0 }
})
