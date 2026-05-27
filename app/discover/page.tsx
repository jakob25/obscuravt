'use client'

import { Suspense } from 'react'
import { StarMap } from '@/components/common/star-map'

export default function DiscoverPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-border px-4 py-4">
        <h1 className="text-2xl font-bold text-vault-cream">Star Map</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore VTubers by constellation — find your vibe, discover your oshi.
        </p>
      </div>
      <div className="flex-1">
        <Suspense fallback={<div className="flex items-center justify-center h-96 text-muted-foreground">Loading star map…</div>}>
          <StarMap />
        </Suspense>
      </div>
    </div>
  )
}
