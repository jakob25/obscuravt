'use client'

import { useState } from 'react'
import { ClipSubmitForm } from '@/components/common/clip-submit-form'

export function DossierClipSubmit({ vtuberId, vtuberName }: { vtuberId: string; vtuberName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-8 border-t border-case-ink-dim/30 pt-6">
      <div className="section-label mb-3 text-case-teal">ADD A CLIP TO THIS FILE</div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 text-sm border border-case-teal text-case-teal hover:bg-case-teal hover:text-case-paper-1 transition-colors font-medium"
        >
          + SUBMIT CLIP
        </button>
      ) : (
        <div className="bg-vault-deep border border-archive-border rounded p-4">
          <ClipSubmitForm
            prefillVtuberId={vtuberId}
            prefillName={vtuberName}
            onCancel={() => setOpen(false)}
            onSuccess={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
