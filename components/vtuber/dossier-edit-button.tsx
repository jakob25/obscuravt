'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { OwnerFileEditor } from '@/components/creator/owner-file-editor'
import { Pencil } from 'lucide-react'

/** On the dossier: if you own the file, click Edit and the form appears. */
export function DossierEditButton({ vtuberId, claimedBy }: { vtuberId: string; claimedBy: string | null }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user || claimedBy !== user.username) return null

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-vault-gold/60 px-3 py-1.5 text-xs font-semibold tracking-wider text-vault-gold hover:bg-vault-gold/10"
      >
        <Pencil className="h-3.5 w-3.5" />
        {open ? 'Close' : 'Edit'}
      </button>
      {open && (
        <div className="w-full max-w-lg">
          <OwnerFileEditor vtuberId={vtuberId} />
        </div>
      )}
    </div>
  )
}
