import { cache } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import {
  PRODUCER_COLUMNS,
  PRODUCER_CREDIT_COLUMNS,
  isProducerId,
  type ProducerCreditRow,
  type ProducerRow,
} from '@/lib/producers'

/**
 * Public, read-only producer lookups (anon client; RLS returns approved rows only).
 * A missing table or failed query means "nothing on file", never a broken page.
 */

export const getProducer = cache(async (id: string): Promise<ProducerRow | null> => {
  if (!isProducerId(id)) return null
  try {
    const { data, error } = await getSupabaseClient()
      .from('producers')
      .select(PRODUCER_COLUMNS)
      .eq('id', id)
      .eq('approved', true)
      .maybeSingle<ProducerRow>()
    return error ? null : data ?? null
  } catch {
    return null
  }
})

export async function listProducers(): Promise<ProducerRow[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('producers')
      .select(PRODUCER_COLUMNS)
      .eq('approved', true)
      .order('name')
      .limit(500)
    return error ? [] : ((data ?? []) as ProducerRow[])
  } catch {
    return []
  }
}

export interface CreditWithVtuber extends ProducerCreditRow {
  vtuber_name: string
}

/** A producer's credits, joined to approved VTubers only (unapproved files are skipped). */
export async function creditsForProducer(producerId: string): Promise<CreditWithVtuber[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('producer_credits')
      .select(PRODUCER_CREDIT_COLUMNS)
      .eq('producer_id', producerId)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error || !data?.length) return []
    const rows = data as ProducerCreditRow[]
    const ids = [...new Set(rows.map(r => r.vtuber_id))]
    const { data: vts } = await supabase.from('vtubers').select('id,name').in('id', ids).eq('approved', true)
    const names = new Map((vts ?? []).map(v => [String(v.id), String(v.name ?? '')]))
    return rows.filter(r => names.has(r.vtuber_id)).map(r => ({ ...r, vtuber_name: names.get(r.vtuber_id) || r.vtuber_id }))
  } catch {
    return []
  }
}

/** Credit counts per producer for the directory. */
export async function creditCounts(producerIds: string[]): Promise<Record<string, number>> {
  if (producerIds.length === 0) return {}
  try {
    const { data, error } = await getSupabaseClient()
      .from('producer_credits')
      .select('producer_id')
      .in('producer_id', producerIds)
    if (error) return {}
    const out: Record<string, number> = {}
    for (const row of data ?? []) out[row.producer_id] = (out[row.producer_id] ?? 0) + 1
    return out
  } catch {
    return {}
  }
}

/** Producers credited on a VTuber's songs, deduped, for the "Music by" line. */
export async function producersForVtuber(vtuberId: string): Promise<{ id: string; name: string }[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('producer_credits')
      .select('producer_id')
      .eq('vtuber_id', vtuberId)
      .limit(50)
    if (error || !data?.length) return []
    const ids = [...new Set(data.map(r => String(r.producer_id)))]
    const { data: producers } = await supabase
      .from('producers')
      .select('id,name')
      .in('id', ids)
      .eq('approved', true)
      .order('name')
    return (producers ?? []).map(p => ({ id: String(p.id), name: String(p.name) }))
  } catch {
    return []
  }
}

/** True once The Booth has at least one producer (so the door never leads to an empty room). */
export async function boothHasProducers(): Promise<boolean> {
  try {
    const { count, error } = await getSupabaseClient()
      .from('producers')
      .select('id', { count: 'exact', head: true })
      .eq('approved', true)
    return !error && (count ?? 0) > 0
  } catch {
    return false
  }
}
