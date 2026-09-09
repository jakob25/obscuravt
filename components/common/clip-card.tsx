'use client'

import { useState, useEffect } from 'react'
import type { Clip } from '@/lib/types'
import { useVTuberById } from '@/hooks/use-data'
import {
  getYouTubeEmbedUrl,
  formatTimestamp,
  getYouTubeThumbnailUrl,
  extractVideoId,
  getTwitchClipEmbedUrl,
} from '@/lib/embed-utils'
import { Play, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface ClipCardProps {
  clip: Clip
  onPlay?: () => void
}

export function ClipCard({ clip, onPlay }: ClipCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [thumb, setThumb] = useState<string | null>(clip.thumbnailUrl ?? null)
  const { vtuber } = useVTuberById(clip.vtuberId)

  const extracted = extractVideoId(clip.videoId)
  const platform = clip.platform || extracted?.platform || 'twitch'
  const rawId = extracted?.videoId ?? clip.videoId

  // Resolve thumbnail: stored → YouTube formula → Twitch via clip-meta
  useEffect(() => {
    if (thumb) return
    if (platform === 'youtube') {
      const yt = getYouTubeThumbnailUrl(clip.videoId)
      if (yt) setThumb(yt)
      return
    }
    if (platform === 'twitch' && clip.videoId.startsWith('http')) {
      let cancelled = false
      fetch(`/api/clip-meta?url=${encodeURIComponent(clip.videoId)}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!cancelled && data?.thumbnail) setThumb(data.thumbnail as string)
        })
        .catch(() => {})
      return () => {
        cancelled = true
      }
    }
  }, [clip.videoId, platform, thumb])

  const handlePlay = () => {
    setIsPlaying(true)
    onPlay?.()
  }

  const embedUrl =
    platform === 'youtube'
      ? getYouTubeEmbedUrl(rawId, clip.startTime, clip.endTime)
      : platform === 'twitch'
        ? getTwitchClipEmbedUrl(rawId, typeof window !== 'undefined' ? window.location.hostname : 'obscuravt.com')
        : null

  const duration =
    clip.startTime !== undefined && clip.endTime !== undefined
      ? formatTimestamp(clip.endTime - clip.startTime)
      : null

  const externalUrl =
    platform === 'youtube'
      ? `https://youtube.com/watch?v=${rawId}${clip.startTime ? `&t=${clip.startTime}` : ''}`
      : clip.videoId.startsWith('http')
        ? clip.videoId
        : `https://clips.twitch.tv/${rawId}`

  return (
    <div className="group flex flex-col items-center">
      <div className="relative w-full max-w-[320px] overflow-hidden rounded-md border border-vault-bronze/30 bg-vault-deep" style={{ aspectRatio: '16 / 9' }}>
        {isPlaying && embedUrl ? (
          <iframe
            src={embedUrl + (platform === 'youtube' ? '&autoplay=1' : '&autoplay=true')}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={handlePlay}
            className="absolute inset-0 h-full w-full overflow-hidden bg-vault-deep"
            style={
              thumb
                ? {
                    backgroundImage: `url(${thumb})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-gradient-to-br from-vault-charcoal/40 to-vault-deep/50" />
            <div className="relative z-10 flex h-full items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-vault-gold/90 shadow-lg transition-all group-hover:scale-110 group-hover:bg-vault-gold">
                <Play className="ml-1 h-7 w-7 text-vault-deep" fill="currentColor" />
              </div>
            </div>
            {duration && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-vault-deep/80 px-2 py-1 text-[10px] text-vault-cream">
                <Clock className="h-3 w-3" />
                {duration}
              </div>
            )}
            <div
              className={`absolute left-2 top-2 rounded border px-2 py-1 text-[10px] font-medium ${
                clip.type === 'raw'
                  ? 'border-vault-gold/30 bg-vault-gold/20 text-vault-gold'
                  : 'border-vault-bronze/30 bg-vault-bronze/20 text-vault-bronze'
              }`}
            >
              {clip.type === 'raw' ? 'Raw Clip' : 'Edited'}
            </div>
            <div className="absolute right-2 top-2 rounded bg-vault-deep/80 px-2 py-1 text-[10px] capitalize text-muted-foreground">
              {platform}
            </div>
          </button>
        )}
      </div>

      <div className="mt-2 w-full max-w-[320px] px-2 text-left">
        <div className="font-mono text-vault-cream line-clamp-2 text-sm leading-tight">
          {clip.title}
        </div>

        <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-vault-gold/90 hover:text-vault-gold"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Watch
          </a>
        </div>

        {vtuber && (
          <Link
            href={`/vtuber/${vtuber.id}`}
            className="mt-2 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-vault-cream"
          >
            <img
              src={vtuber.avatarUrl}
              alt={vtuber.name}
              className="h-6 w-6 rounded-full border border-vault-bronze/30"
            />
            <span className="truncate">{vtuber.name}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
