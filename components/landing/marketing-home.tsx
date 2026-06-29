'use client'

import type { ComponentType } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Building2,
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
import { VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'
import { VaultFrame } from '@/components/vault/vault-frame'

interface FeatureCard {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  href: string
  accent?: string
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Your Circle',
    description: 'Follow creators and get one feed for Chat Made Me Do It, memes, Q&A, karaoke, and schedule votes.',
    icon: Users,
    href: '/help#your-circle',
    accent: 'from-vault-gold/15 to-transparent',
  },
  {
    title: 'Chat Made Me Do It',
    description: 'Fans pitch stream ideas. VTubers pick one and set a scraps goal — funded means it happens.',
    icon: Lightbulb,
    href: '/help#chat-made-me-do-it',
    accent: 'from-[#e056a0]/12 to-transparent',
  },
  {
    title: 'Stream Resources',
    description: 'Chat integrated games, setup tools, and debut prep — built for indies fighting dead air.',
    icon: Wrench,
    href: '/resources',
    accent: 'from-vault-amber/15 to-transparent',
  },
  {
    title: 'Collab',
    description: 'Vibe match %, community overlap, blind collab, and schedule comparer — no follower worship.',
    icon: Users,
    href: '/collab',
    accent: 'from-sky-500/10 to-transparent',
  },
  {
    title: 'Corpo',
    description: 'Small collectives get shared pages and cross-promo on member dossiers. No contracts.',
    icon: Building2,
    href: '/corpo',
    accent: 'from-violet-500/10 to-transparent',
  },
  {
    title: 'Fan Corner',
    description: 'Memes, fan art, karaoke, predictions, and schedule votes — fans shape the stream on every dossier.',
    icon: Heart,
    href: '/clips',
    accent: 'from-rose-500/10 to-transparent',
  },
  {
    title: 'Analytics',
    description: 'Circle size, submissions, karaoke, Q&A, and engagement pulse — for claimed creators only.',
    icon: BarChart3,
    href: '/analytics',
    accent: 'from-emerald-500/10 to-transparent',
  },
  {
    title: 'Clips & Bets',
    description: 'Timestamped clips that link out to creators. Wager scraps on stream outcomes.',
    icon: Trophy,
    href: '/bets',
    accent: 'from-vault-gold/12 to-transparent',
  },
]

const FAN_LOOP = [
  { step: '01', title: 'Discover by vibe', body: 'Browse Discover by tags, search, or the Find My Oshi quiz — personality over subscriber count.', icon: Compass },
  { step: '02', title: 'Clip the moment', body: 'Submit clips with timestamps. Every link drives views back to the creator\'s channel.', icon: Film },
  { step: '03', title: 'Shape the stream', body: 'Chat Made Me Do It, karaoke requests, schedule votes, and bets — fan influence, archived.', icon: Sparkles },
  { step: '04', title: 'Stay in the loop', body: 'Your Circle widget, scraps, and notifications — a daily habit, not a one-time visit.', icon: Heart },
]

function FeatureCardBlock({ feature }: { feature: FeatureCard }) {
  const Icon = feature.icon
  return (
    <Link href={feature.href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vault-gold/50 rounded-xl">
      <VaultPanel className="group relative h-full overflow-hidden transition-all duration-300 hover:border-vault-gold/35 p-5 md:p-6">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent ?? 'from-vault-gold/10 to-transparent'} opacity-80`} />
        <div className="relative flex h-full flex-col">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-vault-gold/25 bg-vault-gold/10 text-vault-gold">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="mb-2 text-base font-bold text-vault-cream group-hover:text-vault-gold">{feature.title}</h3>
          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-vault-gold/80 group-hover:text-vault-gold">
            Learn more <ArrowRight className="h-3 w-3" />
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
                ObscuraVT — Find Your Oshi
              </div>
              <GlitchHeading as="h1" className="max-w-4xl text-4xl md:text-5xl lg:text-6xl font-bold text-vault-cream">
                The creators the algorithm{' '}
                <span className="text-gold-gradient">doesn&apos;t want you to see.</span>
              </GlitchHeading>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                A discovery hub built around vibes, not views. Clip the moments, pledge stream ideas,
                and let fans shape what happens — without contracts, exclusives, or platform lock-in.
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
          <GlitchHeading as="h2" className="text-2xl md:text-3xl font-bold text-vault-cream">Everything the archive needs</GlitchHeading>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Eight pillars connecting fans, creators, and the underground.
          </p>
        </div>
        <VaultDivider className="mb-10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(f => <FeatureCardBlock key={f.title} feature={f} />)}
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-border bg-vault-deep/60">
        <div className="container relative mx-auto px-4 py-14">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <GlitchHeading as="h2" className="text-2xl md:text-3xl font-bold text-vault-cream">How fans shape the stream</GlitchHeading>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Clips that link out. Ideas with scraps behind them. Bets that call the next moment.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <GlitchHeading as="h2" className="text-3xl md:text-4xl font-bold text-vault-cream">Join the underground</GlitchHeading>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
            No algorithm gatekeeping. No contracts. Just vibes, clips, and fans who actually show up.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-vault-gold font-semibold text-vault-deep hover:bg-vault-amber">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-vault-bronze/50 text-vault-cream">
              <Link href="/discover">Explore Discover</Link>
            </Button>
          </div>
        </VaultFrame>
      </section>
    </div>
  )
}
