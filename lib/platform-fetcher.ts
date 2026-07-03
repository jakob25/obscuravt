export interface TwitchChannel {
  id: string
  login: string
  display_name: string
  profile_image_url: string
  description: string
  created_at: string
}

export interface YouTubeChannel {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: {
      default: { url: string }
    }
  }
}

export interface LastStream {
  title: string
  publishedAt: string
  url: string
  platform: 'twitch' | 'youtube'
}

export class PlatformFetcher {
  private twitchClientId = process.env.TWITCH_CLIENT_ID
  private twitchAccessToken = process.env.TWITCH_ACCESS_TOKEN
  private youtubeApiKey = process.env.YOUTUBE_API_KEY

  async getTwitchChannel(loginOrId: string): Promise<TwitchChannel | null> {
    if (!this.twitchClientId || !this.twitchAccessToken) return null

    try {
      const res = await fetch(`https://api.twitch.tv/helix/users?login=${loginOrId}`, {
        headers: {
          'Client-ID': this.twitchClientId,
          'Authorization': `Bearer ${this.twitchAccessToken}`,
        },
      })
      const data = await res.json()
      return data.data?.[0] || null
    } catch (e) {
      console.error('Twitch fetch error:', e)
      return null
    }
  }

  async getYouTubeChannel(channelId: string): Promise<YouTubeChannel | null> {
    if (!this.youtubeApiKey) return null

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${this.youtubeApiKey}`
      )
      const data = await res.json()
      return data.items?.[0] || null
    } catch (e) {
      console.error('YouTube fetch error:', e)
      return null
    }
  }

  async getLastStream(platform: 'twitch' | 'youtube', identifier: string): Promise<LastStream | null> {
    if (platform === 'twitch') {
      try {
        const res = await fetch(`https://api.twitch.tv/helix/videos?user_id=${identifier}&first=1`, {
          headers: {
            'Client-ID': this.twitchClientId!,
            'Authorization': `Bearer ${this.twitchAccessToken!}`,
          },
        })
        const data = await res.json()
        const video = data.data?.[0]
        if (video) {
          return {
            title: video.title,
            publishedAt: video.created_at,
            url: `https://twitch.tv/videos/${video.id}`,
            platform: 'twitch',
          }
        }
      } catch (e) {
        console.error('Twitch last stream error:', e)
      }
    } else if (platform === 'youtube') {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${identifier}&order=date&type=video&maxResults=1&key=${this.youtubeApiKey}`
        )
        const data = await res.json()
        const video = data.items?.[0]
        if (video) {
          return {
            title: video.snippet.title,
            publishedAt: video.snippet.publishedAt,
            url: `https://youtube.com/watch?v=${video.id.videoId}`,
            platform: 'youtube',
          }
        }
      } catch (e) {
        console.error('YouTube last stream error:', e)
      }
    }
    return null
  }
}

export const platformFetcher = new PlatformFetcher()