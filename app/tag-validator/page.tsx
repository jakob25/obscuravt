import { GlitchHeading } from '@/components/vault/glitch-heading'
import { TagValidatorClient } from '@/components/tag-validator/tag-validator-client'
import { Tag } from 'lucide-react'

export default function TagValidatorPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-1 flex items-center gap-2">
          <Tag className="h-6 w-6 text-vault-gold" /> Tag Validator
        </GlitchHeading>
        <p className="text-sm text-muted-foreground mb-4">
          Confirm or challenge vibe tags. Earn Vault Scraps for every yes vote.
        </p>
      </div>
      <TagValidatorClient />
    </div>
  )
}