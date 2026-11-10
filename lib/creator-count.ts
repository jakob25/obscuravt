import { supabaseAdmin } from '@/lib/supabase'

/** Shared count of approved creators (head-only, no rows fetched). */
export async function approvedCreatorCount(): Promise<{ data: number; error?: { message: string } | null }> {
  const res = await supabaseAdmin
    .from('vtubers')
    .select('id', { count: 'exact', head: true })
    .eq('approved', true)
  return { data: res.count ?? 0, error: res.error }
}
