import { NextResponse } from 'next/server'
import { backfillMissingVtuberChannelLinks } from '@/lib/vtuber-channel-link'

export async function GET() {
  try {
    const result = await backfillMissingVtuberChannelLinks(40)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('vtuber link backfill error:', e)
    return NextResponse.json({ ok: false, error: 'backfill failed' }, { status: 500 })
  }
}
