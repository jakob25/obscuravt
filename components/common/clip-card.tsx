'use client'

import { useState } from 'react'
import type { Clip } from '@/lib/types'
import { getVTuberById } from '@/lib/mock-data'
import { getYouTubeEmbedUrl, formatTimestamp } from '@/lib/embed-utils'
import { VibeTagList } from '@/components/common/vibe-tag'
import { Play, ThumbsUp, ThumbsDown, Clock, User, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface ClipCardProps {
  clip: Clip
  onPlay?: () => void
}

export function ClipCard({ clip, onPlay }: ClipCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const vtuber = getVTuberById(clip.vtuberId)

  const handlePlay = () => {
    setIsPlaying(true)
    onPlay?.()
  }

  const embedUrl = clip.platform === 'youtube' 
    ? getYouTubeEmbedUrl(clip.videoId, clip.startTime, clip.endTime)
    : null

  const duration = clip.startTime !== undefined && clip.endTime !== undefined
    ? formatTimestamp(clip.endTime - clip.startTime)
    : null

  return (
    <div className="vault-card rounded-xl overflow-hidden group">
      {/* Video/Thumbnail area */}
      <div className="relative aspect-video bg-vault-deep">
        {isPlaying && embedUrl ? (
          <iframe
            src={embedUrl + '&autoplay=1'}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={handlePlay}
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-vault-charcoal to-vault-deep"
          >
            {/* Placeholder thumbnail */}
            <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-vault-gold/20 to-vault-amber/10" />
            
            {/* Play button */}
            <div className="relative z-10 flex items-center justify-center h-16 w-16 rounded-full bg-vault-gold/90 group-hover:bg-vault-gold group-hover:scale-110 transition-all shadow-lg">
              <Play className="h-7 w-7 text-vault-deep ml-1" fill="currentColor" />
            </div>
            
            {/* Duration badge */}
            {duration && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-vault-deep/80 text-xs text-vault-cream">
                <Clock className="h-3 w-3" />
                {duration}
              </div>
            )}

            {/* Type badge */}
            <div className={`
              absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium
              ${clip.type === 'raw' 
                ? 'bg-vault-gold/20 text-vault-gold border border-vault-gold/30' 
                : 'bg-vault-bronze/20 text-vault-bronze border border-vault-bronze/30'
              }
            `}>
              {clip.type === 'raw' ? 'Raw Clip' : 'Edited'}
            </div>

            {/* Platform badge */}
            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-vault-deep/80 text-xs text-muted-foreground capitalize">
              {clip.platform}
            </div>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-vault-cream line-clamp-2 mb-2 group-hover:text-vault-gold transition-colors">
          {clip.title}
        </h3>

        {/* VTuber info */}
        {vtuber && (
          <Link
            href={`/vtuber/${vtuber.id}`}
            className="flex items-center gap-2 mb-3 group/vtuber"
          >
            <img
              src={vtuber.avatarUrl}
              alt={vtuber.name}
              className="h-6 w-6 rounded-full border border-vault-bronze/30"
            />
            <span className="text-sm text-muted-foreground group-hover/vtuber:text-vault-cream transition-colors">
              {vtuber.name}
            </span>
          </Link>
        )}

        {/* Tags */}
        <VibeTagList tagIds={clip.vibeTags} size="sm" maxTags={3} className="mb-3" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {/* Votes */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-muted-foreground hover:text-vault-gold transition-colors">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs">{clip.votes.up}</span>
            </button>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors">
              <ThumbsDown className="h-4 w-4" />
              <span className="text-xs">{clip.votes.down}</span>
            </button>
          </div>

          {/* Submitted by */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {clip.submittedBy}
          </div>
        </div>
      </div>
    </div>
  )
}
