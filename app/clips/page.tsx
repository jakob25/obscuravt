'use client'

import { useState } from 'react'
import { useClips, useVTubers } from '@/hooks/use-data'
import { ClipCard } from '@/components/common/clip-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-vault-cream">Raw Clips</h1>
        <Link href="/clips"><Button variant="outline" size="sm">Submit a clip</Button></Link>
      </div>
      <div className="mb-4">
        <Input placeholder="Search clips or creators..." value={filter} onChange={e=>setFilter(e.target.value)} className="max-w-md" />
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><div key={i} className="vault-card rounded-xl aspect-video animate-pulse bg-muted/30" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No clips yet. Be the first to submit one!</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(clip => <ClipCard key={clip.id} clip={clip} />)}
        </div>
      )}
    </div>
  )
}
