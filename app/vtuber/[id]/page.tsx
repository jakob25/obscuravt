'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import { useVTuberById, useClips } from '@/hooks/use-data'
import { VibeTagList } from '@/components/common/vibe-tag'
import { ClipCard } from '@/components/common/clip-card'
import { ExternalLink, Youtube, Twitch, Twitter } from 'lucide-react'
import Link from 'next/link'

const platformIcons = {
  youtube: Youtube,
  twitch: Twitch,
  twitter: Twitter,
  discord: ExternalLink,
  website: ExternalLink,
}

interface Props {
  params: Promise<{ id: string }>
}

export default function VTuberPage({ params }: Props) {
  const { id } = use(params)
  const { vtuber, loading: vtLoading } = useVTuberById(id)
  const { clips, loading: clipsLoading } = useClips()

  if (vtLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="vault-card rounded-xl p-6 mb-8 animate-pulse">
          <div className="flex gap-6">
            <div className="h-24 w-24 rounded-full bg-muted/50" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 bg-muted/50 rounded" />
              <div className="h-4 w-full bg-muted/30 rounded" />
              <div className="h-4 w-3/4 bg-muted/30 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!vtuber) return notFound()

  const vtuberClips = clips.filter(c => c.vtuberId === vtuber.id)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="vault-card rounded-xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <img
            src={vtuber.avatarUrl}
            alt={vtuber.name}
            className="h-24 w-24 rounded-full border-2 border-vault-gold/50 self-start"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-vault-cream mb-1">{vtuber.name}</h1>
            {vtuber.bio && <p className="text-sm text-muted-foreground mb-4">{vtuber.bio}</p>}
            <VibeTagList tagIds={vtuber.vibeTags} maxTags={10} />

            {vtuber.externalLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {vtuber.externalLinks.map((link, i) => {
                  const Icon = platformIcons[link.platform] || ExternalLink
                  return (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-vault-cream hover:border-vault-gold/40 transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold text-vault-cream mb-4">
          Clips {!clipsLoading && `(${vtuberClips.length})`}
        </h2>
        {clipsLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1,2].map(i => <div key={i} className="vault-card rounded-xl aspect-video animate-pulse bg-muted/30" />)}
          </div>
        ) : vtuberClips.length === 0 ? (
          <p className="text-muted-foreground text-sm">No clips submitted yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {vtuberClips.map(clip => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}