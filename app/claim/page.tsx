import Link from 'next/link'
import type { Metadata } from 'next'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { VaultDivider } from '@/components/vault/vault-surfaces'
import { ClaimRequestForm } from '@/components/claim/claim-request-form'
import { pageMetadata } from '@/lib/og/page-meta'
import { CLAIM_PAGE } from '@/lib/site-copy'
import { getSupabaseClient } from '@/lib/supabase'

export const revalidate = 300

export const metadata: Metadata = pageMetadata({
  title: 'Claim your file · ObscuraVT',
  description: CLAIM_PAGE.body.join(' '),
  path: '/claim',
})

type Props = { searchParams: Promise<{ file?: string | string[] }> }

export default async function ClaimPage({ searchParams }: Props) {
  const raw = (await searchParams).file
  const fileParam = (Array.isArray(raw) ? raw[0] : raw)?.trim() || null

  // Unclaimed approved files people can ask for (read-only, public fields)
  let files: { id: string; name: string }[] = []
  try {
    const supabase = getSupabaseClient()
    const { data } = supabase
      ? await supabase.from('vtubers').select('id,name').eq('approved', true).is('claimed_by', null).order('name')
      : { data: [] }
    files = (data ?? []).map(r => ({ id: String(r.id), name: String(r.name ?? r.id) }))
  } catch {
    files = []
  }
  const preselected = fileParam && files.some(f => f.id === fileParam) ? fileParam : null

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream">{CLAIM_PAGE.title}</GlitchHeading>
      {CLAIM_PAGE.body.map(line => (
        <p key={line} className="text-sm text-muted-foreground mt-2">{line}</p>
      ))}
      <VaultDivider className="my-6" />

      <section aria-labelledby="claim-does" className="mb-6">
        <h2 id="claim-does" className="text-base font-semibold text-vault-cream mb-2">{CLAIM_PAGE.doesTitle}</h2>
        <p className="text-sm text-muted-foreground mb-2">{CLAIM_PAGE.doesIntro}</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-vault-cream">
          {CLAIM_PAGE.does.map(item => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section aria-labelledby="claim-steps" className="mb-6">
        <h2 id="claim-steps" className="text-base font-semibold text-vault-cream mb-2">{CLAIM_PAGE.stepsTitle}</h2>
        <ol className="space-y-2">
          {CLAIM_PAGE.steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-vault-cream">
              <span className="font-mono text-vault-gold">{String(i + 1).padStart(2, '0')}</span>
              <span>
                {i === 0 ? (
                  <Link href="/login" className="underline underline-offset-2 hover:text-vault-gold">{step}</Link>
                ) : i === 1 ? (
                  <a href="#claim-request" className="underline underline-offset-2 hover:text-vault-gold">{step}</a>
                ) : step}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div id="claim-request" className="scroll-mt-20">
        <VaultFrame className="p-5">
          <ClaimRequestForm files={files} preselected={preselected} />
        </VaultFrame>
      </div>
    </div>
  )
}
