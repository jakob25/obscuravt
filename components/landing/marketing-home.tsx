'use client'

import type { ComponentType } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Compass,
  Film,
  Heart,
  HelpCircle,
  Lightbulb,
  LogIn,
  Sparkles,
  Trophy,
  Users,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { CardRgbTearOverlay } from '@/components/vault/card-rgb-tear-overlay'
import { VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'
import { VaultFrame } from '@/components/vault/vault-frame'
import { SITE_DESCRIPTION, SITE_HERO, SITE_NAME } from '@/lib/site-copy'

interface FeatureCard {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  href: string
  accent?: string
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Signal Network',
    description: 'Track creator threads, fan goals, and hidden engagement paths.',
    icon: Users,
    href: '/help#your-circle',
    accent: 'from-vault-gold/15 to-transparent',
  },
  {
    title: 'Crowd Commands',
    description: 'Fans pitch ideas. Creators pick one and set a scraps goal.',
    icon: Lightbulb,
    href: '/help#chat-made-me-do-it',
    accent: 'from-[#e056a0]/12 to-transparent',
  },
  {
    title: 'Decrypt',
    description: 'Scan tags, search clues, or take the Find My Oshi probe.',
    icon: Compass,
    href: '/discover',
    accent: 'from-sky-500/10 to-transparent',
  },
  {
    title: 'Clips & Bets',
    description: 'Unearth stream fragments and wager on creator outcomes.',
    icon: Trophy,
    href: '/bets',
    accent: 'from-vault-gold/12 to-transparent',
  },
  {
    title: 'Side Channels',
    description: 'Fan art, memes, karaoke, and dossier-side chatter.',
    icon: Heart,
    href: '/clips',
    accent: 'from-rose-500/10 to-transparent',
  },
]

const FAN_LOOP = [
  { step: '01', title: 'Find the fragments', body: 'Browse dossiers, tags, and hidden creator clues.', icon: Compass },
  { step: '02', title: 'Collect evidence', body: 'Save clips, signature moments, and guarded moments.', icon: Film },
  { step: '03', title: 'Build your signal', body: 'Track goals, votes, and the crew you trust.', icon: Sparkles },
]

function FeatureCardBlock({ feature, staggerIndex }: { feature: FeatureCard; staggerIndex: number }) {
  const Icon = feature.icon
  return (
    <Link href={feature.href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vault-gold/50 rounded-xl">
      <VaultPanel className="group relative h-full overflow-hidden transition-all duration-300 hover:border-vault-gold/35 p-5 md:p-6">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent ?? 'from-vault-gold/10 to-transparent'} opacity-80`} />
        <CardRgbTearOverlay staggerIndex={staggerIndex} />
        <div className="relative z-[2] flex h-full flex-col">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-vault-gold/25 bg-vault-gold/10 text-vault-gold">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="mb-2 text-base font-bold text-vault-cream group-hover:text-vault-gold">{feature.title}</h3>
          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-vault-gold/80 group-hover:text-vault-gold">
            Details <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </VaultPanel>
    </Link>
  )
}

export function MarketingHome() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-vault-gold/10 via-transparent to-[#e056a0]/6" />
        <div className="container relative mx-auto px-4 py-14 md:py-20">
          <VaultFrame className="mx-auto max-w-5xl p-8 md:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-vault-gold/25 bg-vault-gold/8 px-4 py-1.5 text-xs font-stamp font-medium tracking-widest text-vault-gold uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                {SITE_NAME}
              </div>
              <GlitchHeading as="h1" className="max-w-4xl text-4xl md:text-5xl lg:text-6xl font-bold text-vault-cream">
                {SITE_HERO}
              </GlitchHeading>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {SITE_DESCRIPTION}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="bg-vault-gold font-semibold text-vault-deep hover:bg-vault-amber">
                  <Link href="/login"><LogIn className="h-4 w-4" /> Sign In</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-vault-bronze/50 text-vault-cream hover:border-vault-gold/40">
                  <Link href="/discover"><Compass className="h-4 w-4" /> Discover</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-vault-bronze/50 text-vault-cream hover:border-vault-gold/40">
                  <Link href="/resources"><Wrench className="h-4 w-4" /> Stream Resources</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-vault-bronze/50 text-vault-cream hover:border-vault-gold/40">
                  <Link href="/help"><HelpCircle className="h-4 w-4" /> How it works</Link>
                </Button>
              </div>
            </div>
          </VaultFrame>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <GlitchHeading as="h2" className="text-2xl md:text-3xl font-bold text-vault-cream">What the archive reveals</GlitchHeading>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Fragments of creator activity, fan-run signals, and the tools to follow them.
          </p>
        </div>
        <VaultDivider className="mb-10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => <FeatureCardBlock key={f.title} feature={f} staggerIndex={i} />)}
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-border bg-vault-deep/60">
        <div className="container relative mx-auto px-4 py-14">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <GlitchHeading as="h2" className="text-2xl md:text-3xl font-bold text-vault-cream">How it works</GlitchHeading>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {FAN_LOOP.map(({ step, title, body, icon: Icon }) => (
              <VaultPanel key={step} className="p-5 md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold tracking-widest text-vault-gold/70">{step}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-vault-gold/20 bg-vault-gold/8 text-vault-gold">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="mb-2 font-bold text-vault-cream">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </VaultPanel>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 md:py-20">
        <VaultFrame className="mx-auto max-w-4xl p-8 md:p-12 text-center">
          <GlitchHeading as="h2" className="text-3xl md:text-4xl font-bold text-vault-cream">Enter the archive</GlitchHeading>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
            Start following the hidden threads. Sign in to contribute, or roam the vault with no clearance.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-vault-gold font-semibold text-vault-deep hover:bg-vault-amber">
              <Link href="/login">Gain Access</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-vault-bronze/50 text-vault-cream">
              <Link href="/discover">Browse the Vault</Link>
            </Button>
          </div>
        </VaultFrame>
      </section>
    </div>
  )
}