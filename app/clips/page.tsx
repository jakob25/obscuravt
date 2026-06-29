'use client'

import { useState } from 'react'
import { useClips, useVTubers } from '@/hooks/use-data'
import { ClipCard } from '@/components/common/clip-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultDivider } from '@/components/vault/vault-surfaces'

export default function ClipsPage() {
  const { clips, loading } = useClips()
  const { vtubers } = useVTubers()
  const [filter, setFilter] = useState('')

  const filtered = clips.filter(c => 
    c.title.toLowerCase().includes(filter.toLowerCase()) || 
    (vtubers.find(v => v.id === c.vtuberId)?.name || '').toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <GlitchHeading as="h1" className="text-3xl font-bold text-vault-cream">Raw Clips</GlitchHeading>
          <p className="text-sm text-muted-foreground mt-1">Community clips with timestamps and source links.</p>
        </div>
        <Link href="/clips"><Button variant="vault" size="sm">Submit a clip</Button></Link>
      </div>
      <VaultDivider className="mb-6" />
      <div className="mb-4">
        <Input placeholder="Search clips or creators..." value={filter} onChange={e=>setFilter(e.target.value)} className="max-w-md" />
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><div key={i} className="vault-panel aspect-video animate-pulse bg-muted/30" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No clips yet. Submit one with a timestamp and link.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(clip => <ClipCard key={clip.id} clip={clip} />)}
        </div>
      )}
    </div>
  )
}