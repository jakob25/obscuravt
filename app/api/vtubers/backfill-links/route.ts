import { NextResponse } from 'next/server'
import { backfillMissingVtuberChannelLinks, syncExistingTwitchIdentities } from '@/lib/vtuber-channel-link'
import { reconcileDuplicateEmptyVtuberStubs } from '@/lib/vtuber-stub-reconcile'
import { hydrateEmptyVtubersFromTwitch } from '@/lib/vtuber-twitch-hydrate'

export async function GET() {
  try {
    const stubs = await reconcileDuplicateEmptyVtuberStubs()
    const result = await backfillMissingVtuberChannelLinks(200)
    const synced = await syncExistingTwitchIdentities(80)
    const hydrated = await hydrateEmptyVtubersFromTwitch(40)
    return NextResponse.json({ ok: true, ...result, stubs, synced, hydrated })
  } catch (e) {
    console.error('vtuber link backfill error:', e)
    return NextResponse.json({ ok: false, error: 'backfill failed' }, { status: 500 })
  }
}
