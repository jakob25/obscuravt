import Link from 'next/link'
import { ExternalLink, Twitch, Twitter, Youtube } from 'lucide-react'
import { CaseField, CaseFolder, CasePhoto, DossierFrame } from '@/components/vault/vault-surfaces'
import { ShareButton } from '@/components/common/share-button'
import styles from '@/components/vtuber/dossier-folio.module.css'
import { getYouTubeEmbedUrl } from '@/lib/embed-utils'
import {
  httpsUrl,
  isProducerRole,
  producerAvatar,
  producerCaseId,
  producerLinks,
  producerPortfolio,
  producerServices,
  youtubeEmbedId,
  type ProducerLinkKey,
  type ProducerRow,
} from '@/lib/producers'
import { PRODUCERS } from '@/lib/site-copy'
import { wrapDisplayName } from '@/lib/wrap-display-name'

export interface ProducerFileCredit {
  id: string
  vtuber_id: string
  vtuber_name: string
  song_title: string
  song_url: string
  role: string
}

/** Same outlined button as the dossier's OPEN CHANNEL link. */
const OUTLINE_BUTTON =
  'inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-medium border border-[#2a6f74] text-case-teal hover:text-[#0d3f42] hover:border-case-teal transition-colors bg-white/10'
/** Same small bordered control as the dossier's FAN CORNER / Share buttons. */
const SMALL_BUTTON =
  'px-4 py-1.5 text-xs border border-case-ink-dim hover:bg-case-ink-dim hover:text-case-paper-1 transition-colors'
const CHIP = 'inline-block px-2 py-0.5 text-xs font-mono border border-case-ink-dim/50 text-[var(--case-ink)]'

function LinkIcon({ k }: { k: ProducerLinkKey }) {
  if (k === 'youtube') return <Youtube className="h-3.5 w-3.5 text-red-700" aria-hidden />
  if (k === 'twitch') return <Twitch className="h-3.5 w-3.5 text-purple-700" aria-hidden />
  if (k === 'x') return <Twitter className="h-3.5 w-3.5 text-sky-500" aria-hidden />
  return <ExternalLink className="h-3.5 w-3.5" aria-hidden />
}

/**
 * The producer case file. Built from the dossier's own pieces (DossierFrame,
 * CaseFolder, CasePhoto, CaseField, dossier-folio styles) so it reads as the
 * same archive; nothing here invents data, and missing fields simply don't render
 * (or show the honest empty line).
 */
export function ProducerFile({ producer, credits }: { producer: ProducerRow; credits: ProducerFileCredit[] }) {
  const avatar = producerAvatar(producer)
  const services = producerServices(producer)
  const tags = producer.genre_tags ?? []
  const links = producerLinks(producer)
  const commission = httpsUrl(producer.commission_url)
  const portfolio = producerPortfolio(producer)

  return (
    <div className={styles.stage}>
    <div className="mx-auto max-w-[760px]">
    <DossierFrame stamp={PRODUCERS.archiveLabel} caseId={producerCaseId(producer.id)} accessLine={PRODUCERS.stamp}>
      <CaseFolder className={styles.profilePaper} stampLabel={PRODUCERS.stamp}>
        <div className={styles.sectionKicker}>{PRODUCERS.kicker}</div>
        <div className={styles.profileTop}>
          <CasePhoto src={avatar} alt={producer.name} caption={PRODUCERS.photoCaption} size="lg" />
          <div className={styles.profileFields}>
            <span className={styles.smallLabel}>{PRODUCERS.name}</span>
            <h1 className={styles.identityName}>{wrapDisplayName(producer.name)}</h1>
            <CaseField
              label={PRODUCERS.servicesOnRecord}
              value={services.length ? services.map(s => PRODUCERS.services[s]).join(' · ') : undefined}
            />
          </div>
        </div>

        <div className={styles.notes}>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-case-teal mb-1.5">{PRODUCERS.fieldNotes}</div>
          <p className="text-[13.5px] leading-relaxed text-[var(--case-ink)] whitespace-pre-line">{producer.bio || PRODUCERS.noBio}</p>
          {commission && (
            <div className="mt-4">
              <a href={commission} target="_blank" rel="noopener noreferrer" className={OUTLINE_BUTTON}>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                {PRODUCERS.commission}
              </a>
            </div>
          )}
        </div>

        {(portfolio || links.length > 0) && (
          <section aria-label={PRODUCERS.linksLabel}>
            <h2 className={styles.notesLabel}>{PRODUCERS.linksLabel}</h2>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {portfolio && (
                <li>
                  <a href={portfolio} target="_blank" rel="noopener noreferrer" className={`${styles.textLink} inline-flex items-center gap-1.5`}>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    {PRODUCERS.portfolio}
                  </a>
                </li>
              )}
              {links.map(link => (
                <li key={link.key}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className={`${styles.textLink} inline-flex items-center gap-1.5`}>
                    <LinkIcon k={link.key} />
                    {PRODUCERS.links[link.key]}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className={styles.notesLabel}>{PRODUCERS.soundProfile}</h2>
          {tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <li key={tag}>
                  <Link href={`/producers?tag=${encodeURIComponent(tag)}`} className={CHIP}>{tag}</Link>
                </li>
              ))}
            </ul>
          ) : <p className={styles.empty}>{PRODUCERS.noSoundProfile}</p>}
        </section>

        <section>
          <h2 className={styles.notesLabel}>{PRODUCERS.servicesOnRecord}</h2>
          {services.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {services.map(s => (
                <li key={s}>
                  <Link href={`/producers?service=${s}`} className={CHIP}>{PRODUCERS.services[s]}</Link>
                </li>
              ))}
            </ul>
          ) : <p className={styles.empty}>{PRODUCERS.noServices}</p>}
        </section>

        <section>
          <h2 className={styles.notesLabel}>{PRODUCERS.creditsOnRecord}</h2>
          {credits.length > 0 ? (
            <ul className="space-y-6">
              {credits.map(credit => {
                const source = httpsUrl(credit.song_url)
                const embedId = source ? youtubeEmbedId(source) : null
                const role = isProducerRole(credit.role) ? PRODUCERS.roles[credit.role] : credit.role
                return (
                  <li key={credit.id} className="border-t border-case-ink-dim/30 pt-3 text-sm text-[var(--case-ink)]" data-credit>
                    <p>
                      {role} {PRODUCERS.creditFor}{' '}
                      <Link href={`/vtuber/${encodeURIComponent(credit.vtuber_id)}`} className={styles.textLink}>{credit.vtuber_name}</Link>
                      , <span className="font-medium">{credit.song_title}</span>
                      {source && (
                        <>
                          {' · '}
                          <a href={source} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{PRODUCERS.source}</a>
                        </>
                      )}
                    </p>
                    {embedId && (
                      <div className="relative mt-3 w-full max-w-[420px] overflow-hidden rounded-md border border-vault-bronze/30 bg-vault-scrim" style={{ aspectRatio: '16 / 9' }}>
                        <iframe
                          src={getYouTubeEmbedUrl(embedId)}
                          title={credit.song_title}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full"
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : <p className={styles.empty}>{PRODUCERS.noCredits}</p>}
        </section>

        <div className={styles.actions}>
          <ShareButton
            path={`/producer/${encodeURIComponent(producer.id)}`}
            title={`${producer.name} · ObscuraVT`}
            label={PRODUCERS.share}
            ariaLabel={PRODUCERS.shareAria(producer.name)}
            className={SMALL_BUTTON}
          />
          <Link href="/producers" className={SMALL_BUTTON}>{PRODUCERS.section}</Link>
        </div>
      </CaseFolder>
    </DossierFrame>
    </div>
    </div>
  )
}
