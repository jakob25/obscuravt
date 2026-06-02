'use client'

import { useState } from 'react'
import type { Clip } from '@/lib/types'
import { useVTuberById } from '@/hooks/use-data'
import { useAuth } from '@/lib/auth-context'
import { getYouTubeEmbedUrl, formatTimestamp } from '@/lib/embed-utils'
import { VibeTagList } from '@/components/common/vibe-tag'
import { Play, ThumbsUp, Clock, User, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface ClipCardProps {
  clip: Clip
  onPlay?: () => void
}

export function ClipCard({ clip, onPlay }: ClipCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [upvotes, setUpvotes] = useState(clip.votes.up)
  const [voted, setVoted] = useState(false)
  const [voting, setVoting] = useState(false)
  const { vtuber } = useVTuberById(clip.vtuberId)
  const { user } = useAuth()

  const handlePlay = () => { setIsPlaying(true); onPlay?.() }

  const embedUrl = clip.platform === 'youtube'
    ? getYouTubeEmbedUrl(clip.videoId, clip.startTime, clip.endTime)
    : null

  const duration = clip.startTime !== undefined && clip.endTime !== undefined
    ? formatTimestamp(clip.endTime - clip.startTime)
    : null

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user || voted || voting) return
    setVoting(true)
    const res = await fetch('/api/clips/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clip_id: clip.id, username: user.username }),
    })
    if (res.ok) { setUpvotes(v => v + 1); setVoted(true) }
    setVoting(false)
  }

  const externalUrl = clip.platform === 'youtube'
    ? `https://youtube.com/watch?v=${clip.videoId}${clip.startTime ? `&t=${clip.startTime}` : ''}`
    : clip.videoId

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
            <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-vault-gold/20 to-vault-amber/10" />
            <div className="relative z-10 flex items-center justify-center h-16 w-16 rounded-full bg-vault-gold/90 group-hover:bg-vault-gold group-hover:scale-110 transition-all shadow-lg">
              <Play className="h-7 w-7 text-vault-deep ml-1" fill="currentColor" />
            </div>
            {duration && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-vault-deep/80 text-xs text-vault-cream">
                <Clock className="h-3 w-3" />{duration}
              </div>
            )}
            <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
              clip.type === 'raw'
                ? 'bg-vault-gold/20 text-vault-gold border border-vault-gold/30'
                : 'bg-vault-bronze/20 text-vault-bronze border border-vault-bronze/30'
            }`}>
              {clip.type === 'raw' ? 'Raw Clip' : 'Edited'}
            </div>
            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-vault-deep/80 text-xs text-muted-foreground capitalize">
              {clip.platform}
            </div>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-vault-cream line-clamp-2 mb-2 group-hover:text-vault-gold transition-colors">
          {clip.title}
        </h3>

        {vtuber && (
          <Link href={`/vtuber/${vtuber.id}`} className="flex items-center gap-2 mb-3 group/vtuber">
            <img src={vtuber.avatarUrl} alt={vtuber.name} className="h-6 w-6 rounded-full border border-vault-bronze/30" />
            <span className="text-sm text-muted-foreground group-hover/vtuber:text-vault-cream transition-colors">{vtuber.name}</span>
          </Link>
        )}

        <VibeTagList tagIds={clip.vibeTags} size="sm" maxTags={3} className="mb-3" />

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            {/* Upvote button */}
            <button
              onClick={handleUpvote}
              disabled={!user || voted || voting}
              title={!user ? 'Sign in to vote' : voted ? 'Already voted' : 'Upvote'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                voted
                  ? 'bg-vault-gold/20 border-vault-gold text-vault-gold'
                  : user
                    ? 'border-border text-muted-foreground hover:border-vault-gold/50 hover:text-vault-gold cursor-pointer'
                    : 'border-border text-muted-foreground cursor-default opacity-60'
              }`}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${voted ? 'fill-vault-gold' : ''}`} />
              {upvotes}
            </button>

            {/* Watch on platform — primary funnel action */}
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground hover:text-vault-cream hover:border-vault-bronze/50 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Watch on {clip.platform === 'youtube' ? 'YouTube' : 'Twitch'}
            </a>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {clip.submittedBy}
          </div>
        </div>
      </div>
    </div>
  )
}
