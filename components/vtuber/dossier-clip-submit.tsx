'use client'

import { useState } from 'react'
import { ClipSubmitForm } from '@/components/common/clip-submit-form'

export function DossierClipSubmit({ vtuberId, vtuberName }: { vtuberId: string; vtuberName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-8 border-t border-[#5a4f2e]/30 pt-6">
      <div className="section-label mb-3 text-[#1f6f6a]">ADD A CLIP TO THIS FILE</div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 text-sm border border-[#1f6f6a] text-[#1f6f6a] hover:bg-[#1f6f6a] hover:text-[#e9dfc4] transition-colors font-medium"
        >
          + SUBMIT CLIP
        </button>
      ) : (
        <div className="bg-[#0d0d14] border border-[#143544] rounded p-4">
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
