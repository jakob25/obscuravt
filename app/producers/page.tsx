import Link from 'next/link'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/vault/page-header'
import { VaultFrame } from '@/components/vault/vault-frame'
import { VaultDivider } from '@/components/vault/vault-surfaces'
import { pageMetadata } from '@/lib/og/page-meta'
import {
  PRODUCER_SERVICES,
  filterProducers,
  genreTagCounts,
  isProducerService,
  producerAvatar,
  producerServices,
} from '@/lib/producers'
import { creditCounts, listProducers } from '@/lib/producers-server'
import { PRODUCERS } from '@/lib/site-copy'
import { cn } from '@/lib/utils'

export const revalidate = 300

export const metadata: Metadata = pageMetadata({
  title: `${PRODUCERS.directoryTitle} · ObscuraVT`,
  description: PRODUCERS.directoryIntro,
  path: '/producers',
})

interface Props {
  searchParams: Promise<{ tag?: string | string[]; service?: string | string[] }>
}

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? ''
}

function filterHref(tag: string, service: string): string {
  const qs = new URLSearchParams()
  if (tag) qs.set('tag', tag)
  if (service) qs.set('service', service)
  const s = qs.toString()
  return s ? `/producers?${s}` : '/producers'
}

const CHIP = 'inline-block px-2.5 py-1 text-xs rounded-full border transition-colors'
const CHIP_ON = 'border-vault-gold/60 bg-vault-gold/20 text-vault-gold'
const CHIP_OFF = 'border-border text-muted-foreground hover:text-vault-cream hover:border-vault-gold/40'

/** The Booth: browse producers by sound (genre/mood tag) and by service. */
export default async function ProducersPage({ searchParams }: Props) {
  const params = await searchParams
  const tag = one(params.tag).toLowerCase()
  const service = isProducerService(one(params.service)) ? one(params.service) : ''

  const producers = await listProducers()
  const tags = genreTagCounts(producers)
  const shown = filterProducers(producers, { tag, service })
  const counts = await creditCounts(shown.map(p => p.id))
  const filtering = Boolean(tag || service)

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <PageHeader title={PRODUCERS.directoryTitle} description={PRODUCERS.directoryIntro} variant="case" fallbackHref="/discover" />
      <VaultDivider className="mb-6" />

      {producers.length > 0 && (
        <nav aria-label="Filters" className="space-y-3 mb-6">
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground mr-1">{PRODUCERS.filterGenre}</span>
              <Link href={filterHref('', service)} className={cn(CHIP, !tag ? CHIP_ON : CHIP_OFF)}>{PRODUCERS.filterAll}</Link>
              {tags.map(t => (
                <Link key={t.tag} href={filterHref(t.tag, service)} className={cn(CHIP, tag === t.tag ? CHIP_ON : CHIP_OFF)}>{t.tag}</Link>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground mr-1">{PRODUCERS.filterService}</span>
            <Link href={filterHref(tag, '')} className={cn(CHIP, !service ? CHIP_ON : CHIP_OFF)}>{PRODUCERS.filterAll}</Link>
            {PRODUCER_SERVICES.map(s => (
              <Link key={s} href={filterHref(tag, s)} className={cn(CHIP, service === s ? CHIP_ON : CHIP_OFF)}>{PRODUCERS.services[s]}</Link>
            ))}
          </div>
        </nav>
      )}

      {producers.length === 0 ? (
        <VaultFrame>
          <p className="p-6 text-sm text-muted-foreground text-center">{PRODUCERS.directoryEmpty}</p>
        </VaultFrame>
      ) : shown.length === 0 ? (
        <VaultFrame>
          <p className="p-6 text-sm text-muted-foreground text-center">
            {PRODUCERS.directoryNoMatch}{' '}
            {filtering && <Link href="/producers" className="text-vault-gold hover:underline">{PRODUCERS.clearFilters}</Link>}
          </p>
        </VaultFrame>
      ) : (
        <ul className="space-y-3">
          {shown.map(p => {
            const avatar = producerAvatar(p)
            const services = producerServices(p)
            const n = counts[p.id] ?? 0
            return (
              <li key={p.id}>
                <VaultFrame>
                  <Link href={`/producer/${encodeURIComponent(p.id)}`} className="flex items-start gap-4 p-5 group">
                    {avatar ? (
                      <img src={avatar} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" loading="lazy" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-vault-gold/20 flex items-center justify-center text-vault-gold font-bold shrink-0" aria-hidden>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-vault-cream group-hover:text-vault-gold transition-colors break-words">{p.name}</p>
                      {(p.genre_tags ?? []).length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">{(p.genre_tags ?? []).join(' · ')}</p>
                      )}
                      {services.length > 0 && (
                        <p className="text-xs text-vault-cream/80 mt-1">{services.map(s => PRODUCERS.services[s]).join(' · ')}</p>
                      )}
                      {n > 0 && (
                        <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground mt-2">{PRODUCERS.creditCount(n)}</p>
                      )}
                    </div>
                  </Link>
                </VaultFrame>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
