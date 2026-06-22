import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ExternalLink, Twitch, Youtube, ArrowLeft, Tag } from 'lucide-react'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { ClaimProfileButton } from '@/components/vtuber/claim-profile-button'
import { VTuberEngagement } from '@/components/vtuber/vtuber-engagement'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  params: Promise<{ id: string }>
}

export default async function VTuberProfilePage({ params }: Props) {
  const { id } = await params

  const { data: vtuber, error } = await supabase
    .from('vtubers')
    .select('*')
    .eq('id', id)
    .eq('approved', true)
    .single()

  if (error || !vtuber) {
    console.error('VTuber profile error:', error)
    notFound()
  }

  // Use custom avatar if available, otherwise show initial
  const hasCustomAvatar = !!vtuber.avatar_url

  // Fetch canonical tag names for display
  const tags: string[] = vtuber.tags ?? []
  const { data: canonicalTags } = await supabase
    .from('canonical_tags')
    .select('id, tag, color, category')
    .in('id', tags.length > 0 ? tags : ['none'])

  const tagMap = Object.fromEntries((canonicalTags ?? []).map(t => [t.id, t]))

  const clusterTag = tags.find(t => t.startsWith('clust_'))
  const cluster = clusterTag ? tagMap[clusterTag] : null
  const vibeTags = tags.filter(t => t.startsWith('vibe_') || t.startsWith('cont_'))

  const platform = (vtuber.platform ?? '').toLowerCase()
  const isTwitch = platform.includes('twitch')
  const isYoutube = platform.includes('youtube')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Back */}
        <Link href="/discover" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-vault-cream mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Discover
        </Link>

        {/* Header card */}
        <VaultFrame className="rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {hasCustomAvatar ? (
              <img
                src={vtuber.avatar_url}
                alt={vtuber.name}
                className="h-16 w-16 rounded-xl object-cover flex-shrink-0 border border-white/10"
              />
            ) : (
              <div
                className="h-16 w-16 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl font-bold text-vault-deep"
                style={{ background: cluster?.color ?? '#d4a574' }}
              >
                {vtuber.name.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream">{vtuber.name}</GlitchHeading>
              {vtuber.handle && (
                <p className="text-sm text-muted-foreground mt-0.5">{vtuber.handle}</p>
              )}

              {/* Constellation badge */}
              {cluster && (
                <div
                  className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-xs font-medium border"
                  style={{ borderColor: cluster.color + '50', backgroundColor: cluster.color + '18', color: cluster.color }}
                >
                  Constellation {cluster.tag}
                </div>
              )}
            </div>
            <ClaimProfileButton vtuberId={vtuber.id} vtuberName={vtuber.name} claimedBy={vtuber.claimed_by ?? null} />
          </div>

          {/* Bio */}
          {vtuber.bio && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{vtuber.bio}</p>
          )}

          {/* Links */}
          {vtuber.link && (
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={vtuber.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-vault-cream hover:border-vault-bronze/40 transition-all"
              >
                {isTwitch ? <Twitch className="h-4 w-4 text-purple-400" /> :
                 isYoutube ? <Youtube className="h-4 w-4 text-red-400" /> :
                 <ExternalLink className="h-4 w-4" />}
                {isTwitch ? 'Twitch' : isYoutube ? 'YouTube' : vtuber.platform ?? 'Channel'}
              </a>
            </div>
          )}
        </VaultFrame>

        {/* Vibe tags */}
        {vibeTags.length > 0 && (
          <VaultFrame className="rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-vault-cream mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-vault-gold" />
              Vibes & Content
            </h2>
            <div className="flex flex-wrap gap-2">
              {vibeTags.map(tagId => {
                const t = tagMap[tagId]
                if (!t) return null
                return (
                  <span
                    key={tagId}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border"
                    style={{
                      borderColor: (t.color ?? '#888') + '50',
                      backgroundColor: (t.color ?? '#888') + '15',
                      color: t.color ?? '#888',
                    }}
                  >
                    {t.tag}
                  </span>
                )
              })}
            </div>
          </VaultFrame>
        )}

        <VTuberEngagement vtuberId={vtuber.id} vtuberName={vtuber.name} claimedBy={vtuber.claimed_by ?? null} />

        {/* Tag validator CTA */}
        <VaultFrame className="rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-vault-cream">Know this VTuber?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Help the community by validating their tags.</p>
          </div>
          <Link
            href="/tag-validator"
            className="flex-shrink-0 inline-flex items-center justify-center h-9 px-4 rounded-lg bg-vault-gold text-vault-deep text-sm font-semibold"
          >
            Validate Tags
          </Link>
        </VaultFrame>

      </div>
    </div>
  )
}
