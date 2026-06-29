'use client'

import Link from 'next/link'
import { Eye, Gift, Compass, Sparkles } from 'lucide-react'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'

const GAMES = [
  {
    href: '/silhouette',
    title: 'Who Is This?',
    description: 'Guess the VTuber from silhouettes on each dossier. Owners can upload custom art.',
    icon: Eye,
  },
  {
    href: '/crane',
    title: 'Vault Crane',
    description: 'Claw machine with profile pictures as prizes. Catch a creator and open their dossier.',
    icon: Gift,
  },
  {
    href: '/find-my-oshi',
    title: 'Find My Oshi',
    description: 'Personality quiz that matches you to creators by vibe tags.',
    icon: Sparkles,
  },
  {
    href: '/discover',
    title: 'Star Map',
    description: 'Vibe and niche maps for browsing the full directory.',
    icon: Compass,
  },
]

export default function DiscoveryGamesPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <GlitchHeading as="h1" className="text-2xl md:text-3xl font-bold text-vault-cream mb-2">
          Discovery Games
        </GlitchHeading>
        <p className="text-sm text-muted-foreground mb-6">
          Mini-games that point fans toward dossiers.
        </p>
        <VaultDivider className="mb-8" />

        <div className="grid sm:grid-cols-2 gap-4">
          {GAMES.map(game => {
            const Icon = game.icon
            return (
              <Link key={game.href} href={game.href} className="block group">
                <VaultPanel className="h-full p-5 transition-colors hover:border-vault-gold/35">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-vault-gold/25 bg-vault-gold/10 text-vault-gold">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-vault-cream group-hover:text-vault-gold transition-colors mb-1">
                        {game.title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">{game.description}</p>
                    </div>
                  </div>
                </VaultPanel>
              </Link>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          Claimed creators can upload silhouettes from their dossier.
        </p>
      </div>
    </div>
  )
}