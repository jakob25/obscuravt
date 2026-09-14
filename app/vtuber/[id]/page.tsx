import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Twitch, Youtube, Twitter } from 'lucide-react'
import {
  DossierFrame,
  CaseFolder,
  CasePhoto,
  CaseField,
} from '@/components/vault/vault-surfaces'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { ClaimProfileButton } from '@/components/vtuber/claim-profile-button'
import { AddToCircleButton } from '@/components/vtuber/add-to-circle-button'
import { NeedsHelpContribute } from '@/components/vtuber/needs-help-contribute'
import { RecommendedStrip } from '@/components/corpo/recommended-strip'
import { SilhouetteAssetPanel } from '@/components/discovery/silhouette-asset-panel'
import { fetchDossierSidebarData } from '@/lib/vtuber-dossier-data'
import { syncTwitchChannelIdentity } from '@/lib/vtuber-channel-link'
import { isNeedsHelpFile } from '@/lib/vtuber-stub-reconcile'
import { EMPTY } from '@/lib/site-copy'
import { getSupabaseClient } from '@/lib/supabase'

const supabase = getSupabaseClient()

interface Props {
  params: Promise<{ id: string }>
}

export default async function VTuberProfilePage({ params }: Props) {
  const { id } = await params

  if (!supabase) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <PageBackNav fallbackHref="/discover" label="Back to Star Map" className="mb-8" />
          <div className="archive-shell rounded-lg border-2 border-[#1e3a4a] p-8 text-center text-[#c9d9df]">
            Vault data is temporarily unavailable while Supabase is not configured.
          </div>
        </div>
      </div>
    )
  }

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

  const synced = await syncTwitchChannelIdentity({
    id: vtuber.id,
    name: vtuber.name,
    handle: vtuber.handle,
    link: vtuber.link,
    platform: vtuber.platform,
  })
  if (synced) {
    vtuber.link = synced.link
    vtuber.handle = synced.handle
    vtuber.name = synced.name
    if (!(vtuber.platform && String(vtuber.platform).trim())) vtuber.platform = 'Twitch'
  }

  const tags: string[] = vtuber.tags ?? []
  const { data: canonicalTags } = await supabase
    .from('canonical_tags')
    .select('id, tag, color, category')
    .in('id', tags.length > 0 ? tags : ['none'])

  const tagMap = Object.fromEntries((canonicalTags ?? []).map(t => [t.id, t]))

  const clusterTag = tags.find(t => t.startsWith('clust_'))
  const cluster = clusterTag ? tagMap[clusterTag] : null

  const platform = (vtuber.platform ?? '').toLowerCase()
  const isTwitch = platform.includes('twitch')
  const isYoutube = platform.includes('youtube')
  const isTwitter = platform.includes('twitter')

  const caseId = `OVT-${String(vtuber.id).replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase().padStart(5, '0')}`

  const channelHint = vtuber.link || vtuber.handle || ''
  const { nextScheduleLabel, lastStreamLabel, lastStreamUrl, liveNow, liveTitle, liveUrl, activeCmdi, openBets } = await fetchDossierSidebarData(id, vtuber.name, vtuber.platform || '', channelHint)

  const { data: corpoGroups } = await supabase
    .from('corpo_groups')
    .select('slug,name,member_vtuber_ids')
    .contains('member_vtuber_ids', [id])

  const corpo = (corpoGroups ?? []).find(g => (g.member_vtuber_ids ?? []).includes(id))
  let corpoSiblings: { id: string; name: string; avatar_url: string | null }[] = []
  if (corpo) {
    const siblingIds = (corpo.member_vtuber_ids ?? []).filter((mid: string) => mid !== id)
    if (siblingIds.length > 0) {
      const { data: sibs } = await supabase
        .from('vtubers')
        .select('id,name,avatar_url')
        .in('id', siblingIds)
        .eq('approved', true)
      corpoSiblings = sibs ?? []
    }
  }

  const needsHelp = isNeedsHelpFile(vtuber)

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        <PageBackNav fallbackHref="/discover" label="Back to Star Map" className="mb-8" preferFallback />

        <div className="archive-shell rounded-lg overflow-hidden border-2 border-[#1e3a4a]">

          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1e3a4a]">
            <div>
              <div className="text-[#4fc9d6] text-[10px] tracking-[0.18em] font-govt uppercase">OBSCURAVT • SUBJECT ARCHIVE</div>
              <div className="text-[#4fd6a8] text-[9px] tracking-[0.1em]">{vtuber.claimed_by ? '● VERIFIED SUBJECT' : '● UNCLAIMED FILE'}</div>
            </div>
            <div className="text-[#5a8a99] text-[10px] mono tracking-[0.08em]">CASE NO. {caseId}</div>
          </div>

          <div className="case-folder p-7">
            
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Link 
                href={`/vtuber/${id}/fan-corner`}
                className="px-4 py-1.5 text-xs border border-[#5a4f2e] hover:bg-[#5a4f2e] hover:text-[#e9dfc4] transition-colors"
              >
                FAN CORNER
              </Link>
              <AddToCircleButton vtuberId={vtuber.id} vtuberName={vtuber.name} />
              <ClaimProfileButton 
                vtuberId={vtuber.id} 
                vtuberName={vtuber.name} 
                claimedBy={vtuber.claimed_by ?? null}
                approved={vtuber.approved !== false}
              />
            </div>

            <NeedsHelpContribute
              vtuberId={vtuber.id}
              vtuberName={vtuber.name}
              needsHelp={needsHelp}
            />

            <SilhouetteAssetPanel
              vtuberId={vtuber.id}
              vtuberName={vtuber.name}
              claimedBy={vtuber.claimed_by ?? null}
              initialSilhouetteUrl={vtuber.silhouette_url ?? null}
            />

            {corpo && corpoSiblings.length > 0 && (
              <div className="mb-6">
                <RecommendedStrip
                  corpoName={corpo.name}
                  corpoSlug={corpo.slug}
                  siblings={corpoSiblings}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
              <div className="lg:col-span-5 flex flex-col sm:flex-row gap-5 items-start">
                <CasePhoto
                  src={vtuber.avatar_url}
                  alt={vtuber.name}
                  caption="FIG. 1 — SUBJECT"
                  size="lg"
                />
                <div className="flex-1 min-w-0 font-mono pt-1">
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

              <div className="lg:col-span-7">
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#1f6f6a] mb-1.5">
                  FIELD NOTES
                </div>
                <p className="text-[13.5px] leading-relaxed text-[var(--case-ink)]">
                  {vtuber.bio || 'No field notes on file.'}
                </p>
                {vtuber.link && (
                  <div className="mt-4">
                    <a
                      href={vtuber.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-medium border border-[#2a6f74] text-[#1f6f6a] hover:text-[#0d3f42] hover:border-[#1f6f6a] transition-colors bg-white/10"
                    >
                        {isTwitch ? <Twitch className="h-3.5 w-3.5 text-purple-700" /> :
                         isYoutube ? <Youtube className="h-3.5 w-3.5 text-red-700" /> :
                         isTwitter ? <Twitter className="h-3.5 w-3.5 text-sky-500" /> :
                         <ExternalLink className="h-3.5 w-3.5" />}
                        {isTwitch ? 'OPEN TWITCH CHANNEL' : isYoutube ? 'OPEN YOUTUBE CHANNEL' : isTwitter ? 'OPEN X' : (vtuber.platform || 'CHANNEL').toUpperCase()}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8 border-t border-[#5a4f2e]/30 pt-6">
              <div className="section-label mb-2 text-[#1d6a9a]">CHAT MADE ME DO IT</div>
              
              {activeCmdi ? (
                <div className="bg-[#0d0d14] border border-[#143544] rounded p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{activeCmdi.title}</span>
                    <span className="text-[#4fc9d6] font-medium">
                      {activeCmdi.goal_amount > 0
                        ? Math.round((activeCmdi.funded_amount / activeCmdi.goal_amount) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#143544] rounded mb-1">
                    <div 
                      className="h-2 bg-[#4fd6a8] rounded transition-all" 
                      style={{
                        width: `${activeCmdi.goal_amount > 0
                          ? Math.min((activeCmdi.funded_amount / activeCmdi.goal_amount) * 100, 100)
                          : 0}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-[#5a8a99]">
                    {activeCmdi.funded_amount.toLocaleString()} / {activeCmdi.goal_amount.toLocaleString()} scraps
                  </div>
                </div>
              ) : (
                <Link 
                  href={`/vtuber/${id}/fan-corner#submit`}
                  className="px-5 py-2.5 text-sm border border-[#1d6a9a] text-[#1d6a9a] hover:bg-[#1d6a9a] hover:text-[#e9dfc4] transition-colors font-medium"
                >
                  + SUBMIT IDEA
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#e9dfc4] border border-[#5a4f2e]/30 rounded p-4">
                <div className="section-label mb-1 text-[#8a2317]">SCHEDULE / LAST STREAM</div>
                <div className="text-sm space-y-1">
                  {liveNow && (
                    <div>
                      {liveUrl ? (
                        <a
                          href={liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[#8a2317] hover:underline"
                        >
                          LIVE NOW{liveTitle ? ` — ${liveTitle}` : ''}
                        </a>
                      ) : (
                        <span className="font-medium text-[#8a2317]">
                          LIVE NOW{liveTitle ? ` — ${liveTitle}` : ''}
                        </span>
                      )}
                    </div>
                  )}
                  {nextScheduleLabel ?? (!liveNow && !lastStreamLabel ? EMPTY.schedule : null)}
                  {lastStreamLabel && (
                    lastStreamUrl ? (
                      <div className="text-xs text-[#2a6f74] mt-1">
                        <a href={lastStreamUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {lastStreamLabel}
                        </a>
                      </div>
                    ) : (
                      <div className="text-xs text-[#2a6f74] mt-1">{lastStreamLabel}</div>
                    )
                  )}
                </div>
              </div>

              <div className="bg-[#e9dfc4] border border-[#5a4f2e]/30 rounded p-4">
                <div className="section-label mb-2 text-[#1f6f6a]">BETS</div>
                
                {openBets.length > 0 ? (
                  <div className="space-y-2">
                    {openBets.map((bet) => (
                      <div key={bet.id} className="text-sm">
                        <div className="font-medium">{bet.title}</div>
                        {bet.options.length > 0 && (
                          <div className="text-xs text-[#5a4f2e]">
                            {bet.options.join(' · ')}
                          </div>
                        )}
                      </div>
                    ))}
                    <Link 
                      href="/bets"
                      className="inline-block mt-1 text-xs text-[#1d6a9a] hover:underline"
                    >
                      All open bets →
                    </Link>
                  </div>
                ) : (
                  <div className="text-sm text-[#5a4f2e]">
                    {EMPTY.bets}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
