// Photo URL parsing and embedding for multiple platforms

export interface PhotoSource {
  platform: 'glass' | 'flickr' | '500px' | 'instagram' | 'twitter' | 'imgur' | 'direct'
  displayUrl: string    // URL to show the image
  sourceUrl: string     // Original link to the post/page
  thumbnailUrl?: string
  platformLabel: string
}

export function parsePhotoUrl(url: string): PhotoSource | null {
  if (!url?.trim()) return null
  const u = url.trim()

  // Glass.app — glass.photo/photo/XXX or glass.photo/@user/XXX
  if (u.includes('glass.photo')) {
    return {
      platform: 'glass',
      displayUrl: u,
      sourceUrl: u,
      platformLabel: 'Glass',
    }
  }

  // Flickr — flickr.com/photos/user/id or live.staticflickr.com
  if (u.includes('flickr.com') || u.includes('staticflickr.com')) {
    const isDirect = u.includes('staticflickr.com') || /\.jpe?g|\. (png|webp)$/i.test(u)
    return {
      platform: 'flickr',
      displayUrl: u,
      sourceUrl: u,
      platformLabel: 'Flickr',
    }
  }

  // Imgur
  if (u.includes('imgur.com')) {
    return { platform: 'imgur', displayUrl: u, sourceUrl: u, platformLabel: 'Imgur' }
  }

  // Twitter/X
  if (u.includes('twitter.com') || u.includes('x.com')) {
    return { platform: 'twitter', displayUrl: u, sourceUrl: u, platformLabel: 'X' }
  }

  // Direct image
  if (/\.(jpe?g|png|webp|gif)$/i.test(u)) {
    return { platform: 'direct', displayUrl: u, sourceUrl: u, platformLabel: 'Image' }
  }

  return null
}
