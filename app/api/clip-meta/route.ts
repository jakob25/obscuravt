import { NextRequest, NextResponse } from 'next/server'
import { extractVideoId, validateClipUrl } from '@/lib/embed-utils'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')?.trim()
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  const validation = validateClipUrl(url)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error || 'Invalid URL' }, { status: 400 })
  }

  const extracted = extractVideoId(url)
  if (!extracted) {
    return NextResponse.json({ error: 'Could not parse video id' }, { status: 400 })
  }

  try {
    let title: string | null = null
    let thumbnail: string | null = null
    let author: string | null = null

    if (extracted.platform === 'youtube') {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      const res = await fetch(oembedUrl, { next: { revalidate: 3600 } })
      if (res.ok) {
        const data = await res.json()
        title = data.title ?? null
        thumbnail = data.thumbnail_url ?? null
        author = data.author_name ?? null
      }
      // Fallback thumbnail from video id if oEmbed missing thumb
      if (!thumbnail) {
        thumbnail = `https://i.ytimg.com/vi/${extracted.videoId}/hqdefault.jpg`
      }
    } else if (extracted.platform === 'twitch') {
      // Twitch oEmbed (works for clips and some VODs)
      const oembedUrl = `https://api.twitch.tv/v5/oembed?url=${encodeURIComponent(url)}`
      const res = await fetch(oembedUrl, { next: { revalidate: 3600 } })
      if (res.ok) {
        const data = await res.json()
        title = data.title ?? null
        thumbnail = data.thumbnail_url ?? null
        author = data.author_name ?? null
      }
      // No reliable free thumb fallback for Twitch without API keys
    } else if (extracted.platform === 'twitter') {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`
      const res = await fetch(oembedUrl, { next: { revalidate: 3600 } })
      if (res.ok) {
        const data = await res.json()
        // Twitter oEmbed gives html; use author_name + a short title from url
        author = data.author_name ?? null
        title = data.author_name
          ? `${data.author_name} on X`
          : `X post ${extracted.videoId}`
        // No standard thumbnail from oEmbed; leave null
      }
    }

    return NextResponse.json({
      platform: extracted.platform,
      videoId: extracted.videoId,
      title,
      thumbnail,
      author,
    })
  } catch (e) {
    console.error('clip-meta error:', e)
    return NextResponse.json(
      {
        platform: extracted.platform,
        videoId: extracted.videoId,
        title: null,
        thumbnail: extracted.platform === 'youtube'
          ? `https://i.ytimg.com/vi/${extracted.videoId}/hqdefault.jpg`
          : null,
        author: null,
      },
      { status: 200 }
    )
  }
}
