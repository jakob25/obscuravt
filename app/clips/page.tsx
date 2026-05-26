'use client'

import { useState } from 'react'
import { clips, getVTuberById } from '@/lib/mock-data'
import { ClipCard } from '@/components/common/clip-card'
import { ClipSubmitForm } from '@/components/common/clip-submit-form'
import { Button } from '@/components/ui/button'
import { Film, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function ClipsPage() {
  const [filter, setFilter] = useState<'all' | 'raw' | 'edited'>('all')

  const filtered = filter === 'all' ? clips : clips.filter(c => c.type === filter)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Film className="h-6 w-6 text-vault-gold" />
          <h1 className="text-2xl font-bold text-vault-cream">Clips</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              Submit Clip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit a Clip</DialogTitle>
            </DialogHeader>
            <ClipSubmitForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'raw', 'edited'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? 'bg-vault-gold text-vault-deep' : 'border-vault-bronze/50 text-vault-cream'}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(clip => {
          return <ClipCard key={clip.id} clip={clip} />
        })}
      </div>
    </div>
  )
}
