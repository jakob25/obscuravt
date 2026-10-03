import { supabaseAdmin } from '@/lib/supabase'

export function compactVtuberKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function hasHttpLink(link: string | null | undefined): boolean {
  return !!(link && /^https?:\/\//i.test(String(link).trim()))
}

function isEmptyFile(row: {
  bio?: string | null
  tags?: unknown
}): boolean {
  const bioEmpty = !(row.bio && String(row.bio).trim())
  const tagsEmpty = !Array.isArray(row.tags) || row.tags.length === 0
  return bioEmpty && tagsEmpty
}

function isAccountedFile(row: {
  bio?: string | null
  tags?: unknown
  claimed_by?: string | null
  avatar_url?: string | null
  link?: string | null
  handle?: string | null
}): boolean {
  if (!isEmptyFile(row)) return true
  if (row.claimed_by && String(row.claimed_by).trim()) return true
  if (row.avatar_url && String(row.avatar_url).trim()) return true
  if (hasHttpLink(row.link)) return true
  if (row.handle && String(row.handle).replace(/^@/, '').trim().length >= 3) return true
  return false
}

export async function reconcileDuplicateEmptyVtuberStubs(): Promise<{ hidden: number; retargeted: number }> {
  const { data, error } = await supabaseAdmin
    .from('vtubers')
    .select('id, name, handle, bio, tags, claimed_by, avatar_url, link, approved')
    .eq('approved', true)
    .limit(2000)

  if (error || !data) {
    if (error) console.error('reconcile stubs select', error.message)
    return { hidden: 0, retargeted: 0 }
  }

  const accountedKeys = new Map<string, string>()
  for (const row of data) {
    const keys = [compactVtuberKey(row.name || ''), compactVtuberKey(row.handle || '')].filter(k => k.length >= 3)
    for (const key of keys) {
      const existing = accountedKeys.get(key)
      if (!existing || isAccountedFile(row)) accountedKeys.set(key, row.id)
    }
  }

  let hidden = 0
  let retargeted = 0
  for (const row of data) {
    if (!isEmptyFile(row)) continue
    if (isAccountedFile(row)) continue
    const keys = [compactVtuberKey(row.name || ''), compactVtuberKey(row.handle || '')].filter(Boolean)
    const keeperId = keys.map(k => accountedKeys.get(k)).find(id => id && id !== row.id)
    if (!keeperId) continue

    const { error: hideErr } = await supabaseAdmin.from('vtubers').update({ approved: false }).eq('id', row.id)
    if (hideErr) {
      console.error('reconcile hide stub', row.id, hideErr.message)
      continue
    }
    hidden += 1

    const { error: clipErr } = await supabaseAdmin.from('clips').update({ profile_id: keeperId }).eq('profile_id', row.id)
    if (clipErr) console.error('reconcile retarget clips', row.id, clipErr.message)
    else retargeted += 1
  }

  return { hidden, retargeted }
}

export function isNeedsHelpFile(row: {
  bio?: string | null
  tags?: unknown
  claimed_by?: string | null
  avatar_url?: string | null
  link?: string | null
  name?: string | null
  handle?: string | null
  id?: string
}, accountedKeys?: Set<string>): boolean {
  if (!isEmptyFile(row)) return false
  if (isAccountedFile(row)) return false
  if (!accountedKeys) return true
  const keys = [compactVtuberKey(row.name || ''), compactVtuberKey(row.handle || '')]
  return !keys.some(k => k && accountedKeys.has(k))
}
