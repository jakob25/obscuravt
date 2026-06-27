import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultDivider } from '@/components/vault/vault-surfaces'
import { TagValidatorClient } from '@/components/tag-validator/tag-validator-client'

export default function TagValidatorPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-1">
          Tag Validator
        </GlitchHeading>
        <p className="text-sm text-muted-foreground mb-4">
          Does this tag fit? Your call shapes the Archive — scraps if you&apos;re right.
        </p>
        <VaultDivider />
      </div>
      <TagValidatorClient />
    </div>
  )
}