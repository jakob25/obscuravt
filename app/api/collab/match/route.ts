import { NextRequest, NextResponse } from 'next/server'
import { matchPercent } from '@/lib/vibe-match'

export async function GET(req: NextRequest) {
  const vtuberA = req.nextUrl.searchParams.get('a')
  const vtuberB = req.nextUrl.searchParams.get('b')
  const blind = req.nextUrl.searchParams.get('blind') === '1'

  if (!vtuberA) return NextResponse.json({ error: 'Query param a (vtuber id) is required.' }, { status: 400 })

  const { supabaseAdmin } = await import('@/lib/supabase')

  const { data: base } = await supabaseAdmin.from('vtubers').select('id,name,tags,avatar_url,bio').eq('id', vtuberA).eq('approved', true).single()
  if (!base) return NextResponse.json({ error: 'VTuber not found.' }, { status: 404 })

  const baseTags = (base.tags ?? []).filter((t: string) => t.startsWith('vibe_') || t.startsWith('cont_'))

  if (vtuberB) {
    const { data: other } = await supabaseAdmin.from('vtubers').select('id,name,tags,avatar_url,bio').eq('id', vtuberB).eq('approved', true).single()
    if (!other) return NextResponse.json({ error: 'Second VTuber not found.' }, { status: 404 })
    const otherTags = (other.tags ?? []).filter((t: string) => t.startsWith('vibe_') || t.startsWith('cont_'))
    const pct = matchPercent(baseTags, otherTags)
    return NextResponse.json({
      matchPercent: pct,
      formula: '|shared vibe tags| / |union of vibe tags| (Jaccard)',
      a: blind ? { id: other.id, name: '???', tags: [] } : { id: other.id, name: other.name, avatar_url: other.avatar_url },
      b: { id: base.id, name: base.name },
    })
  }

  const { data: all } = await supabaseAdmin.from('vtubers').select('id,name,tags,avatar_url').eq('approved', true).neq('id', vtuberA).limit(80)

  const matches = (all ?? [])
    .map(v => {
      const tags = (v.tags ?? []).filter((t: string) => t.startsWith('vibe_') || t.startsWith('cont_'))
      return {
        id: v.id,
        name: blind ? `Creator #${v.id.slice(-4)}` : v.name,
        avatar_url: blind ? null : v.avatar_url,
        matchPercent: matchPercent(baseTags, tags),
      }
    })
    .filter(m => m.matchPercent > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 12)

  return NextResponse.json({
    source: { id: base.id, name: base.name },
    formula: '|shared vibe tags| / |union of vibe tags| (Jaccard)',
    matches,
    blind,
  })
}