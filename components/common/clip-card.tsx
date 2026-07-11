'use client'

import { useState } from 'react'
import type { Clip } from '@/lib/types'
import { useVTuberById } from '@/hooks/use-data'
import { useAuth } from '@/lib/auth-context'
import { getYouTubeEmbedUrl, formatTimestamp } from '@/lib/embed-utils'
import { Play, ThumbsUp, Clock, ExternalLink } from 'lucide-react'
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

  const thumbnailUrl = clip.videoId ? `https://img.youtube.com/vi/${clip.videoId}/mqdefault.jpg` : null

  return (
    <div className="group flex flex-col items-center">
      <div
        className="relative w-full max-w-[320px]"
        style={{ aspectRatio: '4770 / 5570' }}
      >
        <img
          src="/images/polaroid-frame.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-fill z-10 pointer-events-none"
        />

        <div className="absolute z-0" style={{ top: '9.3%', left: '12.6%', right: '10.9%', bottom: '23.6%' }}>
          {isPlaying && embedUrl ? (
            <iframe
              src={embedUrl + '&autoplay=1'}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              onClick={handlePlay}
              className="absolute inset-0 h-full w-full overflow-hidden bg-vault-deep"
              style={thumbnailUrl ? { backgroundImage: `url(${thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-vault-charcoal/80 to-vault-deep/90" />
              <div className="relative z-10 flex h-full items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-vault-gold/90 shadow-lg transition-all group-hover:scale-110 group-hover:bg-vault-gold">
                  <Play className="ml-1 h-7 w-7 text-vault-deep" fill="currentColor" />
                </div>
              </div>
              {duration && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-vault-deep/80 px-2 py-1 text-[10px] text-vault-cream">
                  <Clock className="h-3 w-3" />{duration}
                </div>
              )}
              <div className={`absolute left-2 top-2 rounded border px-2 py-1 text-[10px] font-medium ${
                clip.type === 'raw'
                  ? 'border-vault-gold/30 bg-vault-gold/20 text-vault-gold'
                  : 'border-vault-bronze/30 bg-vault-bronze/20 text-vault-bronze'
              }`}>
                {clip.type === 'raw' ? 'Raw Clip' : 'Edited'}
              </div>
              <div className="absolute right-2 top-2 rounded bg-vault-deep/80 px-2 py-1 text-[10px] capitalize text-muted-foreground">
                {clip.platform}
              </div>
            </button>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 flex h-[23.6%] items-center justify-center px-3 pb-3 pt-2">
          <div className="w-full text-center font-mono text-[#2a2416] line-clamp-2 text-[clamp(8px,1.4vw,13px)] leading-tight">
            {clip.title}
          </div>
        </div>
      </div>

      <div className="mt-3 w-full max-w-[320px] px-2 text-left">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <button
            onClick={handleUpvote}
            disabled={!user || voted || voting}
            title={!user ? 'Sign in to vote' : voted ? 'Already voted' : 'Upvote'}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
              voted
                ? 'border-vault-gold bg-vault-gold/20 text-vault-gold'
                : user
                  ? 'border-border text-muted-foreground hover:border-vault-gold/50 hover:text-vault-gold cursor-pointer'
                  : 'border-border text-muted-foreground cursor-default opacity-60'
            }`}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${voted ? 'fill-vault-gold' : ''}`} />
            {upvotes}
          </button>

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
          <Link href={`/vtuber/${vtuber.id}`} className="mt-2 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-vault-cream">
            <img src={vtuber.avatarUrl} alt={vtuber.name} className="h-6 w-6 rounded-full border border-vault-bronze/30" />
            <span className="truncate">{vtuber.name}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
