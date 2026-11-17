import { getSupabaseClient } from '@/lib/supabase'

/** Display name of a creator's constellation (first clust_* tag), from canonical_tags. */
export async function clusterNameFor(tags: unknown): Promise<string | null> {
  const list = Array.isArray(tags) ? (tags as unknown[]).filter((t): t is string => typeof t === 'string') : []
  const id = list.find(t => t.startsWith('clust_'))
  if (!id) return null
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data } = await supabase.from('canonical_tags').select('tag').eq('id', id).maybeSingle()
  return data?.tag ? String(data.tag) : null
}
