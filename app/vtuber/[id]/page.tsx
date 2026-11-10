import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Twitch, Youtube, Twitter } from 'lucide-react'
import {
  CasePhoto,
  CaseField,
} from '@/components/vault/vault-surfaces'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { ClaimProfileButton } from '@/components/vtuber/claim-profile-button'
import { AddToCircleButton } from '@/components/vtuber/add-to-circle-button'
import { NeedsHelpContribute } from '@/components/vtuber/needs-help-contribute'
import { DossierClipSubmit } from '@/components/vtuber/dossier-clip-submit'
import { SilhouetteAssetPanel } from '@/components/discovery/silhouette-asset-panel'
import { fetchDossierSidebarData } from '@/lib/vtuber-dossier-data'
import { syncTwitchChannelIdentity } from '@/lib/vtuber-channel-link'
import { isNeedsHelpFile } from '@/lib/vtuber-stub-reconcile'
import { hydrateVtuberById } from '@/lib/vtuber-twitch-hydrate'
import { withYoutubeAvatars } from '@/lib/youtube-avatar'
import { DOSSIER, EMPTY } from '@/lib/site-copy'
import { getSupabaseClient, supabaseAdmin } from '@/lib/supabase'
import type { Metadata } from 'next'
import { getShareProfile, shareDescription, siteOrigin } from '@/lib/vtuber-share-meta'
import { ShareButton } from '@/components/common/share-button'
import { CreatorOverview } from '@/components/vtuber/creator-overview'
import creatorSummaries from '@/lib/creator-summaries.json'
import { DossierFolio } from '@/components/vtuber/dossier-folio'
import { DossierArtSheet, type DossierArt } from '@/components/vtuber/dossier-art-sheet'
import { DossierPicturesSheet, type DossierPicture } from '@/components/vtuber/dossier-pictures-sheet'
import { normalizeXPostLink } from '@/lib/x-post-link'
import styles from '@/components/vtuber/dossier-folio.module.css'
import { assignNicheCluster } from '@/lib/niche-assignment'
import { nichePageKindFor } from '@/lib/dossier-niche-pages'
import { wrapDisplayName } from '@/lib/wrap-display-name'

const supabase = getSupabaseClient()

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const profile = await getShareProfile(id)
  if (!profile) return { metadataBase: new URL(siteOrigin()) }
  const title = `${profile.name} · ObscuraVT`
  const description = shareDescription(profile.name, profile.bio)
  return {
    metadataBase: new URL(siteOrigin()),
    title,
    description,
    alternates: { canonical: `/vtuber/${encodeURIComponent(id)}` },
    openGraph: { title, description, type: 'profile', url: `/vtuber/${encodeURIComponent(id)}`, siteName: 'ObscuraVT' },
    twitter: { card: 'summary_large_image', title, description },
  }
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

  // Optional art can load alongside the existing identity/sidebar lookups.
  const dossierArtPromise = fetchDossierArt(id)

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

  try {
    const filled = await hydrateVtuberById(vtuber.id)
    if (filled) {
      const { data: refreshed } = await supabase
        .from('vtubers')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (refreshed) {
        vtuber.bio = refreshed.bio
        vtuber.avatar_url = refreshed.avatar_url
        vtuber.handle = refreshed.handle
        vtuber.link = refreshed.link
        vtuber.platform = refreshed.platform
      }
    }
  } catch (e) {
    console.error('dossier twitch hydrate', e)
  }

  if (!(vtuber.avatar_url && String(vtuber.avatar_url).trim())) {
    const [withYt] = await withYoutubeAvatars([vtuber])
    vtuber.avatar_url = withYt.avatar_url
  }

  const tags: string[] = vtuber.tags ?? []
  const { data: canonicalTags } = await supabase
    .from('canonical_tags')
    .select('id, tag, color, category')
    .in('id', tags.length > 0 ? tags : ['none'])

  const tagMap = Object.fromEntries((canonicalTags ?? []).map(t => [t.id, t]))

  const clusterTag = tags.find(t => t.startsWith('clust_'))
  const cluster = clusterTag ? tagMap[clusterTag] : null

  // Niche-specific page: only for niches listed in NICHE_PAGE_BY_CLUSTER, and
  // only when there is real content. A failed lookup just means no extra page.
  let nicheClusterId: string | null = null
  try {
    const { data: nicheClusters } = await supabase
      .from('canonical_tags')
      .select('id, content_tag_ids, sort_order')
      .eq('category', 'niche_cluster')
      .order('sort_order')
    nicheClusterId = assignNicheCluster(tags, nicheClusters ?? [])
  } catch (e) {
    console.error('dossier niche lookup', e)
  }
  const nichePageKind = nichePageKindFor(nicheClusterId)
  // No lore or character records are stored yet; the World page appears once
  // they are (with the world dossiers work) and the creator actually has some.
  const worldRecordCount = 0
  const showWorldPage = nichePageKind === 'world' && worldRecordCount > 0
  const dossierPicturesPromise = nichePageKind === 'pictures'
    ? fetchDossierPictures(id)
    : Promise.resolve({ posts: [] as DossierPicture[] })

  const platform = (vtuber.platform ?? '').toLowerCase()
  const isTwitch = platform.includes('twitch')
  const isYoutube = platform.includes('youtube')
  const isTwitter = platform.includes('twitter')

  const caseId = `OVT-${String(vtuber.id).replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase().padStart(5, '0')}`

  const channelHint = vtuber.link || vtuber.handle || ''
  const { nextScheduleLabel, lastStreamLabel, lastStreamUrl, liveNow, liveTitle, liveUrl, activeCmdi, openBets } = await fetchDossierSidebarData(id, vtuber.name, vtuber.platform || '', channelHint)

  const { data: corpoGroups } = await supabase
    .from('corpo_groups')
    .select('slug,name,bio,member_vtuber_ids')
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

  const missing: string[] = []
  if (!(vtuber.bio && String(vtuber.bio).trim())) missing.push('bio')
  if (!Array.isArray(vtuber.tags) || vtuber.tags.length === 0) missing.push('tags')
  if (!(vtuber.handle && String(vtuber.handle).replace(/^@+/, '').trim())) missing.push('handle')
  if (!(vtuber.link && /^https?:\/\//i.test(String(vtuber.link).trim()))) missing.push('channel link')
  if (!(vtuber.avatar_url && String(vtuber.avatar_url).trim())) missing.push('avatar')

  const handleLogin = String(vtuber.handle || '').replace(/^@+/, '').trim()
  const channelUrl =
    (vtuber.link && String(vtuber.link).trim()) ||
    (handleLogin
      ? isYoutube
        ? `https://www.youtube.com/@${handleLogin}`
        : isTwitter
          ? `https://x.com/${handleLogin}`
          : `https://www.twitch.tv/${handleLogin}`
      : '')

  let dossierClips: { id: string; title: string; clip_url: string | null; thumbnail_url?: string | null }[] = []
  const { data: clipsByProfile } = await supabaseAdmin
    .from('clips')
    .select('id,title,clip_url,thumbnail_url,vtuber_name,profile_id')
    .eq('profile_id', id)
    .order('created_at', { ascending: false })
    .limit(8)
  dossierClips = clipsByProfile ?? []
  if (dossierClips.length === 0 && vtuber.name) {
    const { data: clipsByName } = await supabaseAdmin
      .from('clips')
      .select('id,title,clip_url,thumbnail_url,vtuber_name,profile_id')
      .ilike('vtuber_name', String(vtuber.name))
      .order('created_at', { ascending: false })
      .limit(8)
    dossierClips = clipsByName ?? []
  }

  const { art: dossierArt, unavailable: artUnavailable } = await dossierArtPromise
  const { posts: dossierPictures } = await dossierPicturesPromise
  const showPicturesPage = dossierPictures.length > 0

  const accessLine = vtuber.claimed_by ? DOSSIER.claimed : DOSSIER.unclaimed
  // Reuse the existing curated creator overview; otherwise quote the actual bio.
  // Never synthesize a new description or treat collective membership as lore.
  const coverSnapshot = creatorSummaries.find(entry => entry.id === vtuber.id)?.text || vtuber.bio || null

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-3 sm:px-5 py-6 max-w-[1320px]">
        <PageBackNav fallbackHref="/discover" label="Back" className="mb-6" />
        <DossierFolio
          name={vtuber.name}
          caseId={caseId}
          accessLine={accessLine}
          avatarUrl={vtuber.avatar_url ?? null}
          handle={handleLogin ? `@${handleLogin}` : ''}
          platform={vtuber.platform || ''}
          cluster={cluster?.tag ?? null}
          collective={corpo?.name ?? null}
          snapshot={coverSnapshot}
          profile={
          <>
            <div className={styles.sectionKicker}>{DOSSIER.subjectRecord}</div>
              <div className={styles.profileTop}>
                <CasePhoto
                  src={vtuber.avatar_url}
                  alt={vtuber.name}
                  caption="FIG. 1 — SUBJECT"
                  size="lg"
                />
                <div className={styles.profileFields}>
                  <span className={styles.smallLabel}>{DOSSIER.codename}</span>
                  <h2 className={styles.identityName}>{wrapDisplayName(vtuber.name)}</h2>
                  {liveNow && (
                    <a
                      href={liveUrl || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 my-1.5 px-2 py-0.5 rounded-sm bg-[#8a2317] text-[#e9dfc4] text-[11px] font-bold tracking-[0.12em] hover:opacity-90"
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e9dfc4] animate-pulse" aria-hidden="true" />
                      LIVE NOW
                    </a>
                  )}
                  <CaseField label="HANDLE" value={handleLogin ? `@${handleLogin}` : undefined} />
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
              <div className={styles.notes}>
                <CreatorOverview id={vtuber.id} />
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#1f6f6a] mb-1.5">
                  FIELD NOTES
                </div>
                <p className="text-[13.5px] leading-relaxed text-[var(--case-ink)]">
                  {vtuber.bio || 'No field notes on file.'}
                </p>
                {channelUrl && (
                  <div className="mt-4">
                    <a
                      href={channelUrl}
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
            <div className={styles.actions}>
              <Link
                href={`/vtuber/${id}/fan-corner`}
                className="px-4 py-1.5 text-xs border border-[#5a4f2e] hover:bg-[#5a4f2e] hover:text-[#e9dfc4] transition-colors"
              >
                FAN CORNER
              </Link>
              <AddToCircleButton vtuberId={vtuber.id} vtuberName={vtuber.name} />
              <ShareButton
                path={`/vtuber/${id}`}
                title={`${vtuber.name} · ObscuraVT`}
                label="Share"
                ariaLabel={`Share ${vtuber.name}'s profile`}
                className="px-4 py-1.5 text-xs border border-[#5a4f2e] hover:bg-[#5a4f2e] hover:text-[#e9dfc4] transition-colors"
              />
              <ClaimProfileButton
                vtuberId={vtuber.id}
                vtuberName={vtuber.name}
                claimedBy={vtuber.claimed_by ?? null}
                approved={vtuber.approved !== false}
              />
            </div>

            <div className="mb-8 border-t border-[#5a4f2e]/30 pt-6">
              <div className="section-label mb-3 text-[#1d6a9a]">CHAT MADE ME DO IT</div>

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

            <div className={styles.lowerCards}>
              <div className="bg-[#e9dfc4] border border-[#5a4f2e]/30 rounded p-4">
                <div className="section-label mb-3 text-[#8a2317]">SCHEDULE / LAST STREAM</div>
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
                <div className="section-label mb-3 text-[#1f6f6a]">BETS</div>

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
            <NeedsHelpContribute
              vtuberId={vtuber.id}
              vtuberName={vtuber.name}
              needsHelp={needsHelp}
              missing={missing}
            />

            <SilhouetteAssetPanel
              vtuberId={vtuber.id}
              vtuberName={vtuber.name}
              claimedBy={vtuber.claimed_by ?? null}
              initialSilhouetteUrl={vtuber.silhouette_url ?? null}
            />
            {/* Collective membership is real, but is not fictional world lore
                or a character roster. Keep those distinctions explicit. */}
            {corpo && (
              <section className={styles.collective}>
                <div className={styles.notesLabel}>{DOSSIER.collective}</div>
                <h3><Link href={`/corpo/${encodeURIComponent(corpo.slug)}`} className={styles.textLink}>{corpo.name} →</Link></h3>
                {corpo.bio && <p>{corpo.bio}</p>}
                {corpoSiblings.length > 0 && <>
                  <h4 className={`${styles.notesLabel} mt-6`}>{DOSSIER.members}</h4>
                  <div className={styles.characters}>
                    {corpoSiblings.map(member => (
                      <Link key={member.id} href={`/vtuber/${encodeURIComponent(member.id)}`} className={styles.character}>
                        {member.avatar_url && <img src={member.avatar_url} alt="" loading="lazy" />}
                        {member.name}
                      </Link>
                    ))}
                  </div>
                </>}
              </section>
            )}

          </>
          }
          nichePage={showPicturesPage ? { key: 'pictures', label: DOSSIER.pictures, content:
          <DossierPicturesSheet posts={dossierPictures} />
          } : showWorldPage ? { key: 'world', label: DOSSIER.world, content:
          <>
            <div className={styles.sheetHeading}><h2 className="section-label text-[#1f6f6a]">{DOSSIER.world}</h2></div>
            <section className={styles.worldSection}>
              <h3 className={styles.notesLabel}>{DOSSIER.lore}</h3>
              <p className={styles.empty}>{DOSSIER.noLore}</p>
            </section>
            <section className={styles.worldSection}>
              <h3 className={styles.notesLabel}>{DOSSIER.characters}</h3>
              <p className={styles.empty}>{DOSSIER.noCharacters}</p>
            </section>
          </> } : null}
          clips={
          <>
            <div className={styles.sheetHeading}>
              <h2 className="section-label text-[#1f6f6a]">CLIPS ON FILE</h2>
              <Link href={`/clips?vtuber=${encodeURIComponent(id)}`} className={styles.textLink}>{DOSSIER.clipsAll}</Link>
            </div>
            <DossierClipSubmit vtuberId={vtuber.id} vtuberName={vtuber.name} />
            {dossierClips.length > 0 ? (
              <div className={styles.clipGrid}>
                {dossierClips.map(clip => {
                  const url = publicMediaUrl(clip.clip_url)
                  return (
                    <a key={clip.id} href={url || '/clips'} target={url ? '_blank' : undefined} rel={url ? 'noopener noreferrer' : undefined} className={styles.clipCard}>
                      {clip.thumbnail_url && <div className={styles.clipThumbnail}><img src={clip.thumbnail_url} alt="" loading="lazy" /></div>}
                      <div className={styles.clipTitle}>{clip.title}</div>
                    </a>
                  )
                })}
              </div>
            ) : <p className={styles.empty}>{EMPTY.clips}</p>}
          </>
          }
          art={<DossierArtSheet art={dossierArt} unavailable={artUnavailable} vtuberId={id} />}
        />
      </div>
    </div>
  )
}

function publicMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

async function fetchDossierPictures(vtuberId: string): Promise<{ posts: DossierPicture[] }> {
  // Same graceful fallback as optional fan_art: a missing table or query
  // error means no pictures page, not a broken dossier.
  try {
    const { data, error } = await supabaseAdmin
      .from('niche_photo_posts')
      .select('id,post_url')
      .eq('vtuber_id', vtuberId)
      .order('created_at', { ascending: false })
      .limit(24)
    if (error) return { posts: [] }
    const posts: DossierPicture[] = []
    for (const row of data ?? []) {
      const post_url = normalizeXPostLink(row.post_url)
      if (post_url) posts.push({ id: String(row.id), post_url })
    }
    return { posts }
  } catch {
    return { posts: [] }
  }
}

async function fetchDossierArt(vtuberId: string): Promise<{ art: DossierArt[]; unavailable: boolean }> {
  // The same unreported gallery records used by /api/fan-art. A missing
  // optional table or an unavailable feed must not take down the dossier.
  try {
    const { data, error: artError } = await supabaseAdmin
      .from('fan_art')
      .select('id,image_url,twitter_url,submitted_by')
      .eq('vtuber_id', vtuberId)
      .eq('reported', false)
      .order('created_at', { ascending: false })
      .limit(12)
    const art: DossierArt[] = (data ?? []).map(piece => ({
      ...piece,
      image_url: publicMediaUrl(piece.image_url),
      twitter_url: publicMediaUrl(piece.twitter_url),
    })).filter(piece => piece.image_url || piece.twitter_url)
    return { art, unavailable: Boolean(artError) }
  } catch {
    return { art: [], unavailable: true }
  }
}
