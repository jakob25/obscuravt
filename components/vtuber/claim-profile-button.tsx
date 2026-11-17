'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { DOSSIER } from '@/lib/site-copy'
import { ShieldCheck, Clock } from 'lucide-react'

interface Props {
  vtuberId: string
  vtuberName: string
  claimedBy: string | null
  approved?: boolean
}

export function ClaimProfileButton({ vtuberId, claimedBy, approved = true }: Props) {
  const { user } = useAuth()

  if (user && claimedBy === user.username) {
    return (
      <p className="text-xs text-vault-gold flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" /> You manage this profile
      </p>
    )
  }
  if (user && claimedBy) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" /> Claimed by @{claimedBy}
      </p>
    )
  }
  if (user && !approved) {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <p className="text-xs text-amber-400 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Pending admin approval
        </p>
        <Link href="/nominator" className="text-[10px] text-vault-gold hover:underline">
          Nomination status →
        </Link>
      </div>
    )
  }
  if (!claimedBy && approved) {
    // One clear way in: the /claim page (request → human approval). Replaces the DM note.
    return (
      <Link
        href={`/claim?file=${encodeURIComponent(vtuberId)}`}
        className="inline-flex items-center rounded-md border border-vault-gold/60 px-3 py-1.5 text-xs font-semibold tracking-wider text-vault-gold hover:bg-vault-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.97]"
      >
        {DOSSIER.claimCta}
      </Link>
    )
  }
  return null
}
