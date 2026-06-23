'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { VTuberSubmitForm } from '@/components/common/vtuber-submit-form'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultFrame } from '@/components/vault/vault-frame'
import { Star, Compass, ShieldCheck, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NominatorPage() {
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-2">
        Nominator
      </GlitchHeading>
      <p className="text-sm text-muted-foreground mb-8">
        The creators the algorithm forgot to show you — put them on the map.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {[
          { Icon: Star, title: 'Nominate', desc: 'Drop a name. We listen.' },
          { Icon: ShieldCheck, title: 'Review', desc: 'Vault staff sanity-checks it' },
          { Icon: Compass, title: 'Star Map', desc: 'Approved = discoverable' },
        ].map(({ Icon, title, desc }) => (
          <VaultFrame key={title}>
            <div className="p-4 text-center">
              <Icon className="h-5 w-5 text-vault-gold mx-auto mb-2" />
              <p className="text-sm font-semibold text-vault-cream">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          </VaultFrame>
        ))}
      </div>

      <VaultFrame>
        <div className="p-6">
          {!user ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                Sign in to nominate a VTuber for the Archive.
              </p>
              <Button asChild className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
                <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Sign In</Link>
              </Button>
            </div>
          ) : (
            <VTuberSubmitForm />
          )}
        </div>
      </VaultFrame>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Submissions are reviewed before appearing on the Star Map.{' '}
        <Link href="/discover" className="text-vault-gold hover:underline">Browse the map</Link>
      </p>
    </div>
  )
}