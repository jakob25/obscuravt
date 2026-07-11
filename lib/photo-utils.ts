// Photo URL parsing and embedding for multiple platforms

import { sanitizeUrl } from '@/lib/validation'

export interface PhotoSource {
  platform: 'glass' | 'flickr' | '500px' | 'instagram' | 'twitter' | 'imgur' | 'direct'
  displayUrl: string    // URL to show the image
  sourceUrl: string     // Original link to the post/page
  thumbnailUrl?: string
  platformLabel: string
}

function getSafeUrl(input: string): string | null {
  const sanitized = sanitizeUrl(input)
  if (!sanitized) return null

  const hostname = new URL(sanitized).hostname.toLowerCase()
  return hostname.includes('glass.photo') || hostname.includes('flickr.com') || hostname.includes('staticflickr.com') || hostname.includes('imgur.com') || hostname.includes('twitter.com') || hostname.includes('x.com') || /\.(jpe?g|png|webp|gif)$/i.test(sanitized)
    ? sanitized
    : null
}

export function parsePhotoUrl(url: string): PhotoSource | null {
  const safeUrl = getSafeUrl(url)
  if (!safeUrl) return null

  const hostname = new URL(safeUrl).hostname.toLowerCase()
  const pathname = new URL(safeUrl).pathname.toLowerCase()

  // Glass.app — glass.photo/photo/XXX or glass.photo/@user/XXX
  if (hostname.includes('glass.photo')) {
    return {
      platform: 'glass',
      displayUrl: safeUrl,
      sourceUrl: safeUrl,
      platformLabel: 'Glass',
    }
  }

  // Flickr — flickr.com/photos/user/id or live.staticflickr.com
  if (hostname.includes('flickr.com') || hostname.includes('staticflickr.com')) {
    return {
      platform: 'flickr',
      displayUrl: safeUrl,
      sourceUrl: safeUrl,
      platformLabel: 'Flickr',
    }
  }

  // Imgur
  if (hostname.includes('imgur.com')) {
    return { platform: 'imgur', displayUrl: safeUrl, sourceUrl: safeUrl, platformLabel: 'Imgur' }
  }

  // Twitter/X
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return { platform: 'twitter', displayUrl: safeUrl, sourceUrl: safeUrl, platformLabel: 'X' }
  }

  // Direct image
  if (/\.(jpe?g|png|webp|gif)$/i.test(pathname)) {
    return { platform: 'direct', displayUrl: safeUrl, sourceUrl: safeUrl, platformLabel: 'Image' }
  }

  return null
}
