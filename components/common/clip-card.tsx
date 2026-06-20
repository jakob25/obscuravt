'use client'

import { useState } from 'react'
import { useVTuberById } from '@/hooks/use-data'
import { Play, Pause, ThumbsUp, ThumbsDown } from 'lucide-react'

interface ClipCardProps {
  clip: any
  onPlay?: (clip: any) => void
}

export function ClipCard({ clip, onPlay }: ClipCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [upvotes, setUpvotes] = useState<number>(clip.votes?.up ?? 0)
  const [voted, setVoted] = useState(false)
  const [voting, setVoting] = useState(false)
  const { vtuber } = useVTuberById(clip.vtuberId)

  const togglePlay = () => {
    const newState = !isPlaying
    setIsPlaying(newState)
    if (newState && onPlay) {
      onPlay(clip)
    }
  }

  const handleVote = async (type: 'up' | 'down') => {
    if (voted || voting) return

    setVoting(true)
    try {
      const res = await fetch('/api/clips/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipId: clip.id, type }),
      })

      if (res.ok) {
        if (type === 'up') {
          setUpvotes(prev => prev + 1)
        }
        setVoted(true)
      }
    } catch (error) {
      console.error('Vote failed:', error)
    } finally {
      setVoting(false)
    }
  }

  return (
    <div className="vault-card overflow-hidden group">
      <div 
        onClick={togglePlay}
        className="aspect-video bg-vault-navy relative cursor-pointer flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
        
        <button className="relative z-10 h-14 w-14 rounded-full bg-vault-gold/90 flex items-center justify-center text-vault-deep hover:bg-vault-gold transition-colors">
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </button>

        {vtuber && (
          <div className="absolute bottom-3 left-3 bg-black/70 px-2.5 py-1 rounded text-xs">
            {vtuber.name}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="font-medium text-sm line-clamp-2 mb-3 group-hover:text-vault-gold transition-colors">
          {clip.title}
        </div>

        <div className="flex items-center justify-between text-sm">
          <button 
            onClick={() => handleVote('up')}
            disabled={voted || voting}
            className="flex items-center gap-1.5 text-white/70 hover:text-vault-gold disabled:opacity-50 transition-colors"
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{upvotes}</span>
          </button>

          <div className="text-xs text-white/50">
            {clip.platform}
          </div>
        </div>
      </div>
    </div>
  )
}
