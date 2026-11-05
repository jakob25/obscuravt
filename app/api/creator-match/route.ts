import { NextRequest, NextResponse } from 'next/server'
import { rateLimits } from '@/lib/rate-limit'
import { handleFromUrl, matchCreator } from '@/lib/creator-match'

/** Read-only: suggest a creator for a clip from handles (never display names). */
export async function GET(req: NextRequest) {
  const rl = await rateLimits.read(req)
  if (!rl.ok) return rl.response!
  const sp = req.nextUrl.searchParams
  const handles = [handleFromUrl(sp.get('url')), ...sp.getAll('handle')].filter(Boolean).slice(0, 12)
  if (!handles.length) return NextResponse.json({ status: 'none' })
  const r = await matchCreator(handles)
  if (r.status === 'match' || r.status === 'pending') {
    return NextResponse.json({ status: r.status, via: r.via, creator: { id: r.creator.id, name: r.creator.name } })
  }
  if (r.status === 'unsure') {
    return NextResponse.json({ status: 'unsure', candidates: r.candidates.map(c => ({ id: c.id, name: c.name, approved: !!c.approved })) })
  }
  return NextResponse.json({ status: 'none' })
}
