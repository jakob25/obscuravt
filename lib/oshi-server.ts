import { getSupabaseClient } from '@/lib/supabase'
import { scoreVTubers } from '@/lib/oshi-score'

/**
 * Server-side Find My Oshi scoring for share cards/metadata. Same approved-only rows,
 * same cluster/vibe split as the quiz (hooks/use-data dbVTuberToType) and the same
 * id order, so a shared link's card names the same top match the page shows.
 */
export async function oshiMatchesFor(answers: string[][]): Promise<{ id: string; name: string }[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase.from('vtubers').select('id,name,tags').eq('approved', true)
  const rows = (data ?? [])
    .map(r => {
      const tags: string[] = Array.isArray(r.tags) ? r.tags : []
      return {
        id: String(r.id),
        name: String(r.name ?? ''),
        category: tags.find(t => t.startsWith('clust_')) ?? 'clust_variety',
        vibeTags: tags.filter(t => !t.startsWith('clust_')),
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
  return scoreVTubers(answers, rows).map(r => ({ id: r.id, name: r.name }))
}
