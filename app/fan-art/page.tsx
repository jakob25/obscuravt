'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Palette, Plus, Flag, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface ArtPiece {
  id: string
  vtuber_id: string
  submitted_by: string
  twitter_url: string
  image_url: string | null
  created_at: string
}

export default function FanArtPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const vtuberId = searchParams.get('vtuber') ?? ''

  const [art, setArt] = useState<ArtPiece[]>([])
  const [loading, setLoading] = useState(true)
  const [twitterUrl, setTwitterUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const url = vtuberId ? `/api/fan-art?vtuberId=${encodeURIComponent(vtuberId)}` : '/api/fan-art'
    const res = await fetch(url)
    const data = await res.json()
    setArt(data.art ?? [])
    setLoading(false)
  }, [vtuberId])

  useEffect(() => { load() }, [load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !vtuberId) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/fan-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vtuberId, twitterUrl, imageUrl: imageUrl || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTwitterUrl(''); setImageUrl(''); setShowForm(false)
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const report = async (artId: string) => {
    if (!user) return
    if (!confirm('Report this submission?')) return
    await fetch('/api/fan-art', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artId }),
    })
    load()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-vault-cream mb-1 flex items-center gap-2">
            <Palette className="h-6 w-6 text-vault-gold" />
            Fan Art Gallery
          </h1>
          <p className="text-muted-foreground text-sm">Community art, always on display.</p>
        </div>
        {user && vtuberId && (
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold flex-shrink-0"
          >
            <Plus className="h-4 w-4" /> Submit
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="vault-card rounded-2xl p-6 mb-8 space-y-3">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
          <input
            value={twitterUrl}
            onChange={e => setTwitterUrl(e.target.value)}
            placeholder="Twitter/X post URL"
            type="url"
            required
            className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground focus:outline-none focus:border-vault-bronze/60"
          />
          <input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="Direct image URL (optional, for gallery preview)"
            type="url"
            className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground focus:outline-none focus:border-vault-bronze/60"
          />
          <button type="submit" disabled={submitting} className="w-full h-10 rounded-lg bg-vault-gold text-vault-deep font-semibold text-sm disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit Art'}
          </button>
        </form>
      )}

      {!vtuberId && (
        <div className="vault-card rounded-xl p-4 mb-6 text-sm text-muted-foreground">
          Showing all fan art across ObscuraVT. Visit a creator's profile to submit art for them specifically.
        </div>
      )}

      {loading && <p className="text-muted-foreground text-sm animate-pulse text-center py-8">Loading gallery…</p>}

      {!loading && art.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">No fan art yet — be the first to submit!</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {art.map(piece => (
          <div key={piece.id} className="vault-card rounded-xl overflow-hidden group relative">
            {piece.image_url ? (
              <img src={piece.image_url} alt="Fan art" className="w-full aspect-square object-cover" />
            ) : (
              <a
                href={piece.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full aspect-square flex flex-col items-center justify-center gap-2 bg-muted/20 text-muted-foreground hover:text-vault-gold transition-colors"
              >
                <ExternalLink className="h-6 w-6" />
                <span className="text-xs">View on X</span>
              </a>
            )}
            <div className="p-2 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground truncate">by {piece.submitted_by}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={piece.twitter_url} target="_blank" rel="noopener noreferrer" className="text-vault-gold hover:underline text-[10px]">
                  Source
                </a>
                {user && (
                  <button onClick={() => report(piece.id)} className="text-muted-foreground hover:text-red-400">
                    <Flag className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!user && (
        <div className="vault-card rounded-xl p-5 text-center mt-6">
          <p className="text-muted-foreground text-sm mb-3">Sign in to submit your own fan art.</p>
          <Link href="/login" className="text-vault-gold text-sm font-medium hover:underline">Sign In →</Link>
        </div>
      )}
    </div>
  )
}
