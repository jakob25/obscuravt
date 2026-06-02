'use client'

import { useState } from 'react'
import { useClips } from '@/hooks/use-data'
import { ClipCard } from '@/components/common/clip-card'
import { ClipSubmitForm } from '@/components/common/clip-submit-form'
import { Button } from '@/components/ui/button'
import { Film, Plus, Zap, Scissors, TrendingUp, Clock, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type SortMode = 'top' | 'new'

export default function ClipsPage() {
  const { clips, loading } = useClips()
  const [filter, setFilter] = useState<'all' | 'raw' | 'edited'>('all')
  const [sort, setSort] = useState<SortMode>('top')
  const [showInfo, setShowInfo] = useState(false)

  const filtered = clips
    .filter(c => filter === 'all' || c.type === filter)
    .sort((a, b) => sort === 'top'
      ? b.votes.up - a.votes.up
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

  const rawCount = clips.filter(c => c.type === 'raw').length
  const editedCount = clips.filter(c => c.type === 'edited').length

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-vault-deep/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Film className="h-6 w-6 text-vault-gold" />
                <h1 className="text-2xl font-bold text-vault-cream">Clips</h1>
                <button
                  onClick={() => setShowInfo(v => !v)}
                  className="text-muted-foreground hover:text-vault-cream transition-colors"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Community-submitted moments. Every clip links back to the original stream.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold flex-shrink-0">
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

          {/* Vision explainer — shown on toggle */}
          {showInfo && (
            <div className="vault-card rounded-xl p-4 mb-4 border-vault-gold/20 bg-vault-gold/5">
              <p className="text-sm text-vault-cream leading-relaxed mb-2">
                <span className="font-semibold text-vault-gold">Raw clips are the point.</span>{' '}
                Unedited moments from streams — funny, skillful, unhinged, or just genuinely human.
                No algorithm decided these were worth saving. A real person did.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every clip drives real views back to the creator on YouTube or Twitch.
                If a clip makes you curious about a VTuber, follow the link. That's what this is for.
              </p>
            </div>
          )}

          {/* Stat pills */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-vault-gold" />
              <span className="text-vault-cream font-medium">{rawCount}</span> raw
            </span>
            <span className="flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5 text-vault-bronze" />
              <span className="text-vault-cream font-medium">{editedCount}</span> edited
            </span>
            <span className="flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-vault-cream font-medium">{clips.length}</span> total
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filters + sort */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex gap-2">
            {([
              ['all', 'All', null],
              ['raw', 'Raw', Zap],
              ['edited', 'Edited', Scissors],
            ] as const).map(([val, label, Icon]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  filter === val
                    ? 'bg-vault-gold/20 border-vault-gold text-vault-gold'
                    : 'border-border text-muted-foreground hover:text-vault-cream hover:border-vault-bronze/50'
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
                <span className="text-xs opacity-60">
                  {val === 'all' ? clips.length : val === 'raw' ? rawCount : editedCount}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {([['top', TrendingUp, 'Top'], ['new', Clock, 'New']] as const).map(([val, Icon, label]) => (
              <button
                key={val}
                onClick={() => setSort(val)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  sort === val
                    ? 'bg-muted/50 border-border text-vault-cream'
                    : 'border-transparent text-muted-foreground hover:text-vault-cream'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Raw clips callout — only when viewing raw */}
        {filter === 'raw' && !loading && rawCount > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-vault-gold/5 border border-vault-gold/20 mb-6">
            <Zap className="h-5 w-5 text-vault-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-vault-cream mb-0.5">Raw clips — unfiltered, unedited</p>
              <p className="text-xs text-muted-foreground">
                These are direct timestamps from live streams. No cuts, no music, no branding.
                Just the moment as it happened.
              </p>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="vault-card rounded-xl aspect-video animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Film className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-vault-cream font-medium mb-1">
              {filter !== 'all' ? `No ${filter} clips yet` : 'No clips yet'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Clips are submitted by the community — be the first to add one.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
                  <Plus className="mr-2 h-4 w-4" /> Submit a Clip
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Submit a Clip</DialogTitle></DialogHeader>
                <ClipSubmitForm />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(clip => <ClipCard key={clip.id} clip={clip} />)}
          </div>
        )}
      </div>
    </div>
  )
}
