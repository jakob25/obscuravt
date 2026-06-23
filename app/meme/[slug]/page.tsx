'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Image, ThumbsUp, Share2 } from 'lucide-react'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { useAuth } from '@/lib/auth-context'

interface MemeDetail {
  id: string
  vtuber_id: string | null
  submitted_by: string
  image_url: string
  caption: string
  upvotes: number
  share_slug: string
  vtuber_name: string | null
}

export default function MemeSharePage() {
  const params = useParams()
  const slug = params.slug as string
  const { user } = useAuth()
  const [meme, setMeme] = useState<MemeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/memes?slug=${encodeURIComponent(slug)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Meme not found')
      setMeme(data.meme)
    } catch (err: unknown) {
      setMeme(null)
      setError(err instanceof Error ? err.message : 'Failed to load meme')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [slug])

  const upvote = async () => {
    if (!meme || !user) return
    const res = await fetch('/api/memes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ memeId: meme.id }),
    })
    if (res.ok) load()
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground animate-pulse">
        Loading meme…
      </div>
    )
  }

  if (error || !meme) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md text-center">
        <p className="text-muted-foreground mb-4">{error || 'Meme not found.'}</p>
        <Link href="/discover" className="text-vault-gold hover:underline text-sm">Back to Star Map</Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <PageBackNav
        fallbackHref={meme.vtuber_id ? `/vtuber/${meme.vtuber_id}` : '/discover'}
        label={meme.vtuber_name ? `Back to ${meme.vtuber_name}` : 'Back to Discover'}
      />

      <GlitchHeading as="h1" className="text-xl font-bold text-vault-cream mb-1 flex items-center gap-2">
        <Image className="h-5 w-5 text-vault-gold" /> Vault Meme
      </GlitchHeading>
      <p className="text-sm text-muted-foreground mb-6">
        Shared by @{meme.submitted_by}
        {meme.vtuber_name && <> · for <span className="text-vault-cream">{meme.vtuber_name}</span></>}
      </p>

      <VaultFrame>
        <div className="p-4">
          <img src={meme.image_url} alt={meme.caption || 'Vault meme'} className="w-full rounded-xl object-contain max-h-[70vh] bg-muted/20" />
          {meme.caption && <p className="text-sm text-vault-cream mt-4">{meme.caption}</p>}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={upvote}
              disabled={!user}
              className="text-sm text-vault-gold flex items-center gap-1.5 disabled:opacity-40 hover:text-vault-amber"
            >
              <ThumbsUp className="h-4 w-4" /> {meme.upvotes} upvotes
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="text-sm text-muted-foreground hover:text-vault-cream flex items-center gap-1.5"
            >
              <Share2 className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
          {!user && (
            <p className="text-xs text-muted-foreground mt-3">
              <Link href="/login" className="text-vault-gold hover:underline">Sign in</Link> to upvote.
            </p>
          )}
        </div>
      </VaultFrame>
    </div>
  )
}