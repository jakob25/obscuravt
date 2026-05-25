import { notFound } from 'next/navigation'
import { vtubers, clips, getVTuberById } from '@/lib/mock-data'
import { VibeTagList } from '@/components/common/vibe-tag'
import { ClipCard } from '@/components/common/clip-card'
import { ExternalLink, Youtube, Twitch, Twitter } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

const platformIcons = {
  youtube: Youtube,
  twitch: Twitch,
  twitter: Twitter,
  discord: ExternalLink,
  website: ExternalLink,
}

export function generateStaticParams() {
  return vtubers.map(v => ({ id: v.id }))
}

export default function VTuberPage({ params }: Props) {
  const vtuber = getVTuberById(params.id)
  if (!vtuber) notFound()

  const vtuberClips = clips.filter(c => c.vtuberId === vtuber.id)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="vault-card rounded-xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <img
            src={vtuber.avatarUrl}
            alt={vtuber.name}
            className="h-24 w-24 rounded-full border-2 border-vault-gold/50 self-start"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-vault-cream">{vtuber.name}</h1>
              {vtuber.isWorkerVTuber && (
                <span className="px-2 py-0.5 rounded text-xs bg-vault-bronze/20 text-vault-bronze border border-vault-bronze/30">
                  Worker VTuber
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">{vtuber.timezone}</p>
            <p className="text-sm text-muted-foreground mb-4">{vtuber.bio}</p>

            <VibeTagList tagIds={vtuber.vibeTags} maxTags={10} />

            {/* Links */}
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

          {/* Scraps */}
          <div className="flex flex-col items-center justify-center px-6 py-4 rounded-lg bg-vault-gold/10 border border-vault-gold/20 self-start">
            <span className="text-2xl font-bold text-vault-gold">{vtuber.scraps.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Scraps</span>
          </div>
        </div>

        {/* Interests */}
        {(vtuber.interests.length > 0 || vtuber.interestedInMaking.length > 0) && (
          <div className="mt-6 pt-4 border-t border-border grid sm:grid-cols-2 gap-4">
            {vtuber.interests.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Interests</h3>
                <div className="flex flex-wrap gap-1">
                  {vtuber.interests.map(i => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-xs text-vault-cream">{i}</span>
                  ))}
                </div>
              </div>
            )}
            {vtuber.interestedInMaking.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Wants to Make</h3>
                <div className="flex flex-wrap gap-1">
                  {vtuber.interestedInMaking.map(i => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-xs text-vault-cream">{i}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clips */}
      <section>
        <h2 className="text-xl font-bold text-vault-cream mb-4">
          Clips ({vtuberClips.length})
        </h2>
        {vtuberClips.length === 0 ? (
          <p className="text-muted-foreground text-sm">No clips submitted yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {vtuberClips.map(clip => (
              <ClipCard key={clip.id} clip={clip} vtuber={vtuber} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
