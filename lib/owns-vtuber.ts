import { supabaseAdmin } from '@/lib/supabase'

/** True if username owns this VTuber profile (claimed_by or user_claimed_profiles). */
export async function ownsVtuber(username: string, vtuberId: string): Promise<boolean> {
  const { data: vtuber } = await supabaseAdmin
    .from('vtubers')
    .select('claimed_by')
    .eq('id', vtuberId)
    .single()

  if (vtuber?.claimed_by === username) return true

  const { data: link } = await supabaseAdmin
    .from('user_claimed_profiles')
    .select('vtuber_id')
    .eq('username', username)
    .eq('vtuber_id', vtuberId)
    .maybeSingle()

  return !!link
}