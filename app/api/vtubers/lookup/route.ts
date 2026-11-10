import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { rateLimits } from '@/lib/rate-limit'
import { creatorKeys, matchCreator } from '@/lib/creator-match'
import { lookupVtuberProfile } from '@/lib/vtuber-profile-lookup'

export async function POST(req: NextRequest) {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session

  const rl = await rateLimits.lookup(req)
  if (!rl.ok) return rl.response!

  let url = ''
  try {
    const body = await req.json()
    url = typeof body?.url === 'string' ? body.url : ''
  } catch {
    return NextResponse.json({ error: 'Paste an X, YouTube, or Twitch profile link' }, { status: 400 })
  }

  const result = await lookupVtuberProfile(url)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const keys = creatorKeys({ handle: result.handle, link: result.link })
  const matched = keys.length ? await matchCreator(keys) : { status: 'none' as const }
  const duplicate =
    matched.status === 'match' || matched.status === 'pending'
      ? { status: matched.status, id: matched.creator.id, name: matched.creator.name }
      : matched.status === 'unsure'
        ? { status: 'unsure' as const, id: null, name: null }
        : null

  return NextResponse.json({ ...result, duplicate })
}
