import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Film, Images, UserCircle2 } from 'lucide-react'
import { ClipCard } from '@/components/common/clip-card'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { extractVideoId } from '@/lib/embed-utils'
import { getSupabaseClient } from '@/lib/supabase'
import type { Clip } from '@/lib/types'

const supabase = getSupabaseClient()

interface ClusterPageProps {
  params: Promise<{ clusterId: string }>
}

interface ClusterRow {
  id: string
  tag: string
  color: string | null
  description: string | null
}

interface ContentWallRow {
  headline: string | null
  description: string | null
  pinned_vtuber_ids: string[] | null
}

interface CreatorRow {
  id: string
  name: string
  avatar_url: string | null
}

interface ClipRow {
  id: string
  title: string | null
  clip_url: string | null
  profile_id: string | null
  submitter: string | null
  upvotes: number | null
  created_at: string | null
  tags: string[] | null
  description: string | null
}

interface FanArtRow {
  id: string
  vtuber_id: string | null
  image_url: string | null
  twitter_url: string | null
  created_at: string | null
}

export async function generateStaticParams() {
  const { data, error } = await supabase
    .from('canonical_tags')
    .select('id')
    .eq('category', 'cluster')

  if (error || !data) return []

  return data.map((row) => ({ clusterId: row.id as string }))
}

export default async function ClusterContentWallPage({ params }: ClusterPageProps) {
  const { clusterId } = await params

  const [clusterRes, wallRes, creatorsRes] = await Promise.all([
    supabase
      .from('canonical_tags')
      .select('id, tag, color, description')
      .eq('id', clusterId)
      .eq('category', 'cluster')
      .maybeSingle<ClusterRow>(),
    supabase
      .from('content_walls')
      .select('headline, description, pinned_vtuber_ids')
      .eq('id', clusterId)
      .maybeSingle<ContentWallRow>(),
    supabase
      .from('vtubers')
      .select('id, name, avatar_url')
      .eq('approved', true)
      .contains('tags', [clusterId])
      .order('name'),
  ])

  if (clusterRes.error || !clusterRes.data) {
    notFound()
  }

  const cluster = clusterRes.data
  const wall = wallRes.data
  const creators = (creatorsRes.data ?? []) as CreatorRow[]
  const pinnedIds = new Set((wall?.pinned_vtuber_ids ?? []).filter(Boolean))
  const orderedCreators = [...creators].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id) ? 1 : 0
    const bPinned = pinnedIds.has(b.id) ? 1 : 0
    return bPinned - aPinned || a.name.localeCompare(b.name)
  })

  const vtuberIds = orderedCreators.map((creator) => creator.id)

  let clips: Clip[] = []
  let fanArt: FanArtRow[] = []

  if (vtuberIds.length > 0) {
    const [clipsRes, fanArtRes] = await Promise.all([
      supabase
        .from('clips')
        .select('id, title, clip_url, profile_id, submitter, upvotes, created_at, tags, description')
        .in('profile_id', vtuberIds)
        .order('upvotes', { ascending: false })
        .limit(12),
      supabase
        .from('fan_art')
        .select('id, vtuber_id, image_url, twitter_url, created_at')
        .in('vtuber_id', vtuberIds)
        .order('created_at', { ascending: false })
        .limit(12),
    ])

    clips = (clipsRes.data ?? []).map((clip) => {
      const parsed = extractVideoId(clip.clip_url ?? '')
      return {
        id: clip.id,
        vtuberId: clip.profile_id ?? '',
        title: clip.title ?? 'Untitled clip',
        platform: parsed?.platform === 'twitch' ? 'twitch' : 'youtube',
        videoId: parsed?.videoId ?? '',
        vibeTags: Array.isArray(clip.tags) ? clip.tags : [],
        type: 'raw' as const,
        submittedBy: clip.submitter ?? 'Vault',
        votes: { up: clip.upvotes ?? 0, down: 0 },
        createdAt: clip.created_at ?? '',
      }
    })

    fanArt = (fanArtRes.data ?? []) as FanArtRow[]
  }

  const heroTitle = wall?.headline?.trim() || `${cluster.tag} archive`
  const heroDescription = wall?.description?.trim() || cluster.description?.trim() || 'A cold dossier of creators, clips, and scraps bound to this cluster.'
  const hasContent = orderedCreators.length > 0 || clips.length > 0 || fanArt.length > 0

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 text-sm text-vault-gold/90">
          <Link href="/discover" className="transition-colors hover:text-vault-gold">
            ← Return to discovery
          </Link>
        </div>

        <VaultFrame className="overflow-hidden border border-border/80">
          <div
            className="relative overflow-hidden p-6 md:p-8"
            style={{
              background: `linear-gradient(135deg, ${cluster.color ?? '#4fc9d6'}30 0%, rgba(6, 12, 21, 0.96) 60%, rgba(4, 7, 14, 0.98) 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_45%)]" />
            <div className="relative z-10">
              <div className="mb-3 inline-flex items-center rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-vault-cream/80">
                Cluster dossier
              </div>
              <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream md:text-3xl">
                {cluster.tag}
              </GlitchHeading>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-vault-cream/80">{heroTitle}</p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-vault-cream/70">{heroDescription}</p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-vault-cream/80">
                <div className="rounded border border-white/10 bg-black/20 px-3 py-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-vault-gold">Creators</span>
                  <div className="mt-1 font-semibold">{orderedCreators.length}</div>
                </div>
                <div className="rounded border border-white/10 bg-black/20 px-3 py-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-vault-gold">Clips</span>
                  <div className="mt-1 font-semibold">{clips.length}</div>
                </div>
                <div className="rounded border border-white/10 bg-black/20 px-3 py-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-vault-gold">Fan art</span>
                  <div className="mt-1 font-semibold">{fanArt.length}</div>
                </div>
              </div>
            </div>
          </div>
        </VaultFrame>

        {!hasContent ? (
          <VaultFrame className="mt-6 p-6 text-center">
            <p className="text-sm text-muted-foreground">This archive is still empty. Help seed it by nominating creators and scraps.</p>
            <Link href="/nominator" className="mt-4 inline-flex text-sm font-medium text-vault-gold transition-colors hover:underline">
              Open the nominator
            </Link>
          </VaultFrame>
        ) : (
          <div className="mt-8 space-y-8">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-vault-gold" />
                <GlitchHeading as="h2" className="text-xl font-bold text-vault-cream">
                  Creators
                </GlitchHeading>
              </div>
              {orderedCreators.length === 0 ? (
                <VaultFrame className="p-6 text-sm text-muted-foreground">No creators have been filed under this cluster yet.</VaultFrame>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {orderedCreators.map((creator) => (
                    <Link key={creator.id} href={`/vtuber/${creator.id}`} className="rounded border border-border/70 bg-black/20 p-3 transition-colors hover:border-vault-gold/50 hover:bg-black/30">
                      <div className="flex items-center gap-3">
                        <img src={creator.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(creator.id)}`} alt={creator.name} className="h-10 w-10 rounded-full border border-vault-gold/30 object-cover" />
                        <div className="min-w-0">
                          <div className="font-medium text-vault-cream">{creator.name}</div>
                          <div className="text-xs text-muted-foreground">Open dossier</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Film className="h-4 w-4 text-vault-gold" />
                <GlitchHeading as="h2" className="text-xl font-bold text-vault-cream">
                  Clips
                </GlitchHeading>
              </div>
              {clips.length === 0 ? (
                <VaultFrame className="p-6 text-sm text-muted-foreground">
                  No clips have surfaced for this cluster yet. <Link href="/nominator" className="text-vault-gold hover:underline">Add one</Link>.
                </VaultFrame>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {clips.map((clip) => (
                    <ClipCard key={clip.id} clip={clip} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Images className="h-4 w-4 text-vault-gold" />
                <GlitchHeading as="h2" className="text-xl font-bold text-vault-cream">
                  Fan art
                </GlitchHeading>
              </div>
              {fanArt.length === 0 ? (
                <VaultFrame className="p-6 text-sm text-muted-foreground">
                  No fan art is archived for this cluster yet. <Link href="/nominator" className="text-vault-gold hover:underline">Nominate a piece</Link>.
                </VaultFrame>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {fanArt.map((art) => (
                    <VaultFrame key={art.id} className="overflow-hidden">
                      <div className="aspect-[4/5] bg-muted/20">
                        {art.image_url ? (
                          <img src={art.image_url} alt="Fan art" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image attached</div>
                        )}
                      </div>
                      <div className="p-3 text-sm">
                        <div className="text-vault-cream">Fan art fragment</div>
                        {art.twitter_url ? (
                          <a href={art.twitter_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs text-vault-gold hover:underline">
                            Open source
                          </a>
                        ) : null}
                      </div>
                    </VaultFrame>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
