import { supabase } from '@/lib/supabase'
import { worldInput, type WorldInput } from './schema'

// No dependency on claims or platform accounts; missing migration/API is non-fatal.
export async function readWorlds(dossierId?: string, slug?: string): Promise<{ worlds: WorldInput[]; unavailable: boolean }> {
  try {
    let query = supabase.from('corpo_groups').select('slug,name,bio,member_vtuber_ids,world_details').eq('kind', 'world').order('name').order('slug')
    if (dossierId) query = query.contains('member_vtuber_ids', [dossierId])
    if (slug) query = query.eq('slug', slug)
    const { data, error } = await query.abortSignal(AbortSignal.timeout(5000))
    if (error) return { worlds: [], unavailable: true }
    const worlds: WorldInput[] = []
    for (const row of data ?? []) {
      const parsed = worldInput.safeParse(row)
      if (parsed.success) worlds.push(parsed.data)
    }
    return { worlds, unavailable: false }
  } catch { return { worlds: [], unavailable: true } }
}
