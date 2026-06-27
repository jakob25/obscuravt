'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Plus, Flag, ExternalLink } from 'lucide-react'
import { ImageUploadField } from '@/components/common/image-upload-field'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { GalleryWall, GalleryWallItem, VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'
import { Button } from '@/components/ui/button'

interface ArtPiece {
  id: string
  vtuber_id: string
  submitted_by: string
  twitter_url: string
  image_url: string | null
  created_at: string
}

function FanArtPageContent() {
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
    if (!twitterUrl.trim() && !imageUrl.trim()) {
      setError('Drop a link or upload something.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/fan-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vtuberId, twitterUrl: twitterUrl.trim() || null, imageUrl: imageUrl.trim() || null }),
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
    if (!confirm('Report this piece?')) return
    await fetch('/api/fan-art', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artId }),
    })
    load()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageBackNav fallbackHref={vtuberId ? `/vtuber/${vtuberId}` : '/discover'} />
      <div className="flex items-center justify-between mb-4">
        <div>
          <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-1">Fan art wall</GlitchHeading>
          <p className="text-muted-foreground text-sm">Community art, pinned and overlapping like it should be.</p>
        </div>
        {user && vtuberId && (
          <Button
            onClick={() => setShowForm(s => !s)}
            variant="vault"
            size="sm"
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" /> Submit
          </Button>
        )}
      </div>
      <VaultDivider className="mb-8" />

      {showForm && (
        <VaultPanel className="mb-8">
          <form onSubmit={submit} className="space-y-3">
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
            <ImageUploadField
              purpose="fan-art"
              label="Upload fan art"
              onUploaded={url => setImageUrl(url)}
              onClear={() => setImageUrl('')}
              disabled={submitting}
            />
            <input
              value={twitterUrl}
              onChange={e => setTwitterUrl(e.target.value)}
              placeholder="X post URL (optional if you uploaded)"
              type="url"
              className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground focus:outline-none focus:border-vault-bronze/60"
            />
            <input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="Or paste direct image URL"
              type="url"
              className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground focus:outline-none focus:border-vault-bronze/60"
            />
            <Button type="submit" disabled={submitting} variant="vault" className="w-full">
              {submitting ? 'Submitting…' : 'Pin to wall'}
            </Button>
          </form>
        </VaultPanel>
      )}

      {!vtuberId && (
        <p className="text-sm text-muted-foreground mb-6">
          Whole-archive wall. Hit a creator&apos;s profile to submit art for them.
        </p>
      )}

      {loading && <p className="text-muted-foreground text-sm animate-pulse text-center py-8">Pulling the wall…</p>}

      {!loading && art.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">Blank wall. Be first to hang something.</p>
      )}

      <GalleryWall>
        {art.map((piece, i) => (
          <GalleryWallItem key={piece.id} tilt={i % 3 === 0 ? 'left' : i % 3 === 1 ? 'right' : 'none'}>
            <div className="group relative bg-muted/20">
              {piece.image_url ? (
                <img src={piece.image_url} alt="Fan art" className="w-full object-cover" />
              ) : (
                <a
                  href={piece.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[160px] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-vault-gold transition-colors p-6"
                >
                  <ExternalLink className="h-6 w-6" />
                  <span className="text-xs">View on X</span>
                </a>
              )}
              <div className="p-2 flex items-center justify-between bg-vault-deep/80">
                <span className="text-[10px] text-muted-foreground truncate">by {piece.submitted_by}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {piece.twitter_url.startsWith('http') && !piece.twitter_url.includes('supabase') && (
                    <a href={piece.twitter_url} target="_blank" rel="noopener noreferrer" className="text-vault-gold hover:underline text-[10px]">
                      Source
                    </a>
                  )}
                  {user && (
                    <button onClick={() => report(piece.id)} className="text-muted-foreground hover:text-red-400" aria-label="Report">
                      <Flag className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </GalleryWallItem>
        ))}
      </GalleryWall>

      {!user && (
        <VaultPanel className="text-center mt-8">
          <p className="text-muted-foreground text-sm mb-3">Sign in to hang your own art.</p>
          <Link href="/login" className="text-vault-gold text-sm font-medium hover:underline">Enter the Vault →</Link>
        </VaultPanel>
      )}
    </div>
  )
}

export default function FanArtPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-4xl text-sm text-muted-foreground animate-pulse">Pulling the wall…</div>}>
      <FanArtPageContent />
    </Suspense>
  )
}