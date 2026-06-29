'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'
import { VaultPanel } from '@/components/vault/vault-surfaces'

interface Props {
  vtuberId: string
  signals: string[]
}

export function ShapeTheStreamBanner({ vtuberId, signals }: Props) {
  if (signals.length === 0) return null

  return (
    <VaultPanel className="p-4 mb-4 border-vault-gold/30 bg-vault-gold/5">
      <div className="flex items-start gap-3">
        <Zap className="h-5 w-5 text-vault-gold shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-vault-cream">Shape the stream</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fans are actively influencing this dossier right now.
          </p>
          <ul className="mt-2 space-y-0.5">
            {signals.map(s => (
              <li key={s} className="text-xs text-vault-cream">· {s}</li>
            ))}
          </ul>
          <Link
            href={`/cmdmi?profile=${vtuberId}`}
            className="inline-block mt-2 text-xs text-vault-gold hover:underline"
          >
            Jump in →
          </Link>
        </div>
      </div>
    </VaultPanel>
  )
}