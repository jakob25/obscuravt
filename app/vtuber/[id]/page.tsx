import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ExternalLink, Twitch, Youtube } from 'lucide-react'
import { VaultFrame } from '@/components/vault/vault-frame'
import {
  DossierFrame,
  CaseFolder,
  CasePhoto,
  CaseField,
  VaultDivider,
} from '@/components/vault/vault-surfaces'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { ClaimProfileButton } from '@/components/vtuber/claim-profile-button'
import { AddToCircleButton } from '@/components/vtuber/add-to-circle-button'
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

  // Short case ID derived from the row id — stable, not random per render
  const caseId = `OVT-${String(vtuber.id).replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase().padStart(5, '0')}`

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        <PageBackNav fallbackHref="/discover" label="Back to Star Map" className="mb-8" />

        <DossierFrame
          stamp="ObscuraVT · Subject Archive"
          caseId={`CASE NO. ${caseId}`}
          accessLine={vtuber.claimed_by ? '● VERIFIED SUBJECT' : '● UNCLAIMED FILE'}
          glitchable
          className="mb-6"
        >
          <CaseFolder
            stampLabel={vtuber.claimed_by ? 'VERIFIED' : 'UNCLAIMED'}
            stampSub={cluster?.tag ?? undefined}
          >
            <div className="flex items-start gap-5">
              <CasePhoto
                src={vtuber.avatar_url}
                alt={vtuber.name}
                caption="FIG. 1 — SUBJECT"
              />

              <div className="flex-1 min-w-0 font-mono">
                <CaseField label="CODENAME" value={vtuber.name} />
                <CaseField label="HANDLE" value={vtuber.handle || undefined} />
                <CaseField
                  label="CLUSTER"
                  value={cluster ? `FILED UNDER ${cluster.tag.toUpperCase()}` : undefined}
                />
                <CaseField
                  label="PLATFORM"
                  value={isTwitch ? 'TWITCH' : isYoutube ? 'YOUTUBE' : vtuber.platform || undefined}
                />
              </div>
            </div>

            {vtuber.bio && (
              <div className="mt-5">
                <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--case-ink-dim)] mb-1.5">
                  Field Notes
                </div>
                <p className="text-sm leading-relaxed text-[var(--case-ink)]">
                  {vtuber.bio}
                </p>
              </div>
            )}

            {vtuber.link && (
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={vtuber.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-medium border border-[rgba(60,50,20,0.3)] text-[var(--case-ink-dim)] hover:text-[var(--case-ink)] hover:border-[rgba(60,50,20,0.5)] transition-colors bg-white/20"
                >
                  {isTwitch ? <Twitch className="h-3.5 w-3.5 text-purple-700" /> :
                   isYoutube ? <Youtube className="h-3.5 w-3.5 text-red-700" /> :
                   <ExternalLink className="h-3.5 w-3.5" />}
                  {isTwitch ? 'TWITCH CHANNEL' : isYoutube ? 'YOUTUBE CHANNEL' : (vtuber.platform || 'CHANNEL').toUpperCase()}
                </a>
              </div>
            )}
          </CaseFolder>

          <div className="flex items-center justify-between px-5 pb-1 -mt-1">
            <span className="font-mono text-[9px] tracking-wide text-[var(--archive-text-dim)]">
              {vibeTags.length > 0 ? `${vibeTags.length} TAG${vibeTags.length === 1 ? '' : 'S'} ON FILE` : 'NO TAGS ON FILE'}
            </span>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <AddToCircleButton vtuberId={vtuber.id} vtuberName={vtuber.name} />
              <ClaimProfileButton
                vtuberId={vtuber.id}
                vtuberName={vtuber.name}
                claimedBy={vtuber.claimed_by ?? null}
              />
            </div>
          </div>
        </DossierFrame>

        <VaultDivider />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vibeTags.length > 0 && (
            <VaultFrame className="rounded-sm p-6">
              <h2 className="text-sm font-semibold text-vault-cream mb-3 font-mono uppercase tracking-wider">
                Vibe tags
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

          <div className={vibeTags.length > 0 ? 'md:col-span-2 lg:col-span-2' : 'md:col-span-2 lg:col-span-3'}>
            <VTuberEngagement vtuberId={vtuber.id} vtuberName={vtuber.name} claimedBy={vtuber.claimed_by ?? null} />
          </div>

          <VaultFrame className="rounded-sm p-5 flex flex-col justify-between gap-4 h-full">
            <div>
              <p className="text-sm font-medium text-vault-cream">Tag check</p>
              <p className="text-xs text-muted-foreground mt-0.5">Confirm or challenge what&apos;s on file.</p>
            </div>
            <Link
              href="/tag-validator"
              className="vault-btn-texture flex-shrink-0 inline-flex items-center justify-center h-9 px-4 bg-vault-gold text-vault-deep text-sm font-semibold"
            >
              Open validator
            </Link>
          </VaultFrame>
        </div>

      </div>
    </div>
  )
}
