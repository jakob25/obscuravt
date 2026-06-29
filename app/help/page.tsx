'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HELP_SECTIONS } from '@/lib/help-content'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex w-full items-start justify-between gap-4 py-4 text-left transition-colors hover:text-vault-gold"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-vault-cream">{q}</span>
        <ChevronDown
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180 text-vault-gold',
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-200',
          open ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-muted-foreground">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <PageBackNav fallbackHref="/" />

        <div className="mb-6 mt-4">
          <GlitchHeading as="h1" variant="case" className="text-2xl md:text-3xl font-bold text-vault-cream">
            How ObscuraVT Works
          </GlitchHeading>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Practical answers about discovery, your circle, community features, and creator tools.
          </p>
        </div>

        <VaultDivider className="mb-8" />

        <div className="space-y-6">
          {HELP_SECTIONS.map(section => (
            <VaultPanel key={section.id} className="p-5 md:p-6">
              <div id={section.id} className="scroll-mt-24" />
              <h2 className="mb-1 text-lg font-bold text-vault-cream font-govt tracking-wide">{section.title}</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                {section.items.length} questions
              </p>
              <div>
                {section.items.map(item => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </VaultPanel>
          ))}
        </div>
      </div>
    </div>
  )
}
