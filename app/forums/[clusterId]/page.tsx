'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useStarMapData } from '@/hooks/use-star-map-data'
import { ArrowLeft, ThumbsUp, Send } from 'lucide-react'
import Link from 'next/link'

interface Post {
  id: string
  username: string
  content: string
  upvotes: number
  created_at: string
}

export default function ClusterForumPage() {
  const params = useParams()
  const clusterId = params.clusterId as string
  const { user } = useAuth()
  const { constellations } = useStarMapData()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const constellation = constellations.find(c => c.id === clusterId)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/forums?constellationId=${encodeURIComponent(clusterId)}`)
    const data = await res.json()
    setPosts(data.posts ?? [])
    setLoading(false)
  }, [clusterId])

  useEffect(() => { load() }, [load])

  const post = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim()) return
    setPosting(true)
    await fetch('/api/forums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ constellationId: clusterId, content }),
    })
    setContent('')
    await load()
    setPosting(false)
  }

  const upvote = async (postId: string) => {
    if (!user || busyId) return
    setBusyId(postId)
    await fetch('/api/forums', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
    await load()
    setBusyId(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/forums" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-vault-cream mb-6">
        <ArrowLeft className="h-4 w-4" /> All forums
      </Link>

      <div className="flex items-center gap-3 mb-8">
        {constellation && <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: constellation.color }} />}
        <h1 className="text-2xl font-bold text-vault-cream">{constellation?.name ?? 'Forum'}</h1>
      </div>

      {user ? (
        <form onSubmit={post} className="vault-card rounded-2xl p-4 mb-6 flex gap-2">
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share something with this constellation…"
            className="flex-1 h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground focus:outline-none focus:border-vault-bronze/60"
          />
          <button type="submit" disabled={posting || !content.trim()} className="h-10 px-4 rounded-lg bg-vault-gold text-vault-deep font-semibold text-sm disabled:opacity-50 flex items-center gap-1.5">
            <Send className="h-4 w-4" /> Post
          </button>
        </form>
      ) : (
        <div className="vault-card rounded-xl p-4 mb-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-vault-gold hover:underline">Sign in</Link> to post.
        </div>
      )}

      {loading && <p className="text-muted-foreground text-sm animate-pulse text-center py-8">Loading posts…</p>}

      {!loading && posts.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">No posts yet — start the conversation.</p>
      )}

      <div className="space-y-3">
        {posts.map(p => (
          <div key={p.id} className="vault-card rounded-xl p-4 flex items-start gap-3">
            <button
              onClick={() => upvote(p.id)}
              disabled={!user || busyId === p.id}
              className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-vault-gold disabled:opacity-50 flex-shrink-0 pt-0.5"
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs font-medium">{p.upvotes}</span>
            </button>
            <div className="min-w-0">
              <div className="text-sm text-vault-cream">{p.content}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{p.username} · {new Date(p.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
