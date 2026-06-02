'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useStarMapData } from '@/hooks/use-star-map-data'
import type { ClusterPost } from '@/lib/types'
import { MessageSquare, ThumbsUp, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function ForumsPage() {
  const { user } = useAuth()
  const { constellations } = useStarMapData()
  const [activeConst, setActiveConst] = useState<string | null>(null)
  const [posts, setPosts] = useState<ClusterPost[]>([])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (constellations.length > 0 && !activeConst) {
      setActiveConst(constellations[0].id)
    }
  }, [constellations, activeConst])

  useEffect(() => {
    if (!activeConst) return
    setLoading(true)
    fetch(`/api/forums?constellation_id=${activeConst}`)
      .then(r => r.json())
      .then(data => { setPosts(data); setLoading(false) })
  }, [activeConst])

  const post = async () => {
    if (!user || !content.trim() || !activeConst) return
    setPosting(true)
    const res = await fetch('/api/forums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ constellation_id: activeConst, username: user.username, content }),
    })
    const data = await res.json()
    if (res.ok) {
      setPosts(prev => [data, ...prev])
      setContent('')
    }
    setPosting(false)
  }

  const upvote = async (postId: string) => {
    if (!user || votedIds.has(postId)) return
    const res = await fetch('/api/forums/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, username: user.username }),
    })
    if (res.ok) {
      setVotedIds(prev => new Set([...prev, postId]))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p))
    }
  }

  const activeColor = constellations.find(c => c.id === activeConst)?.color

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-vault-gold" />
        <h1 className="text-2xl font-bold text-vault-cream">Cluster Forums</h1>
      </div>

      {/* Constellation tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {constellations.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveConst(c.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeConst === c.id ? 'border-current' : 'border-border text-muted-foreground hover:text-vault-cream'
            }`}
            style={activeConst === c.id ? { borderColor: c.color, color: c.color, background: `${c.color}15` } : {}}
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
            {c.name}
          </button>
        ))}
      </div>

      {/* Post composer */}
      {user ? (
        <div className="vault-card rounded-xl p-4 mb-6">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, 280))}
            placeholder={`Post in ${constellations.find(c => c.id === activeConst)?.name ?? 'this constellation'}…`}
            rows={3}
            className="w-full bg-transparent text-vault-cream text-sm placeholder:text-muted-foreground resize-none outline-none"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <span className={`text-xs ${content.length > 250 ? 'text-vault-gold' : 'text-muted-foreground'}`}>
              {content.length}/280
            </span>
            <Button
              size="sm"
              onClick={post}
              disabled={!content.trim() || posting}
              className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold gap-1.5"
              style={activeColor ? { background: activeColor } : {}}
            >
              {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Post
            </Button>
          </div>
        </div>
      ) : (
        <div className="vault-card rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            <Link href="/login" className="text-vault-gold hover:underline">Sign in</Link> to post in the forums
          </p>
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="vault-card rounded-xl p-4 h-20 animate-pulse bg-muted/20" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="vault-card rounded-xl p-10 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No posts yet — be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="vault-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Link
                      href={`/user/${post.username}`}
                      className="text-sm font-medium text-vault-cream hover:text-vault-gold transition-colors"
                    >
                      {post.username}
                    </Link>
                    <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{post.content}</p>
                  {post.vtuber_id && (
                    <Link href={`/vtuber/${post.vtuber_id}`} className="text-xs text-vault-gold hover:underline mt-1 inline-block">
                      View VTuber →
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => upvote(post.id)}
                  disabled={!user || votedIds.has(post.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs transition-colors flex-shrink-0 ${
                    votedIds.has(post.id)
                      ? 'bg-vault-gold/20 border-vault-gold text-vault-gold'
                      : user
                        ? 'border-border text-muted-foreground hover:border-vault-gold/40 hover:text-vault-gold cursor-pointer'
                        : 'border-border text-muted-foreground cursor-default opacity-50'
                  }`}
                >
                  <ThumbsUp className="h-3 w-3" />
                  {post.upvotes}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
