'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { useVibeTags } from '@/hooks/use-data'
import { useStarMapData } from '@/hooks/use-star-map-data'
import { Plus, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface VTuberSubmitFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function VTuberSubmitForm({ onSuccess, onCancel }: VTuberSubmitFormProps) {
  const { user } = useAuth()
  const { vibeTags } = useVibeTags()
  const { constellations } = useStarMapData()

  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [platform, setPlatform] = useState('')
  const [link, setLink] = useState('')
  const [bio, setBio] = useState('')
  const [constellation, setConstellation] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const toggleTag = (id: string) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : prev.length < 8 ? [...prev, id] : prev
    )
  }

  const isValid = name.trim().length >= 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setError('You must be signed in.'); return }
    if (!isValid) return

    setSubmitting(true)
    setError(null)

    const tags = constellation ? [constellation, ...selectedTags] : selectedTags

    const res = await fetch('/api/vtubers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        handle: handle.trim(),
        platform: platform.trim(),
        link: link.trim(),
        bio: bio.trim(),
        tags,
        submitted_by: user.username,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setSubmitting(false)
      return
    }

    setDone(true)
    setSubmitting(false)
    setTimeout(() => onSuccess?.(), 1500)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle className="h-10 w-10 text-vault-gold" />
        <p className="font-semibold text-vault-cream">Submitted for review!</p>
        <p className="text-sm text-muted-foreground">They'll appear on the Star Map once approved.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!user && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-vault-gold/10 border border-vault-gold/30 text-sm text-vault-gold">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          You need to be signed in to submit a VTuber.
        </div>
      )}

      <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
        Submissions are reviewed before appearing on the Star Map. Fill in as much as you know.
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-1.5">
          Name / Streamer Name <span className="text-red-400">*</span>
        </label>
        <Input
          placeholder="e.g. Bermuda Muda"
          value={name}
          onChange={e => setName(e.target.value)}
          className="bg-muted/30 border-border text-vault-cream placeholder:text-muted-foreground"
        />
      </div>

      {/* Handle + Platform */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-vault-cream mb-1.5">Handle</label>
          <Input
            placeholder="@handle"
            value={handle}
            onChange={e => setHandle(e.target.value)}
            className="bg-muted/30 border-border text-vault-cream placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-vault-cream mb-1.5">Platform</label>
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-vault-cream text-sm"
          >
            <option value="">Select...</option>
            <option value="Twitch">Twitch</option>
            <option value="YouTube">YouTube</option>
            <option value="Twitch/YouTube">Twitch + YouTube</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Link */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-1.5">Channel Link</label>
        <Input
          type="url"
          placeholder="https://twitch.tv/..."
          value={link}
          onChange={e => setLink(e.target.value)}
          className="bg-muted/30 border-border text-vault-cream placeholder:text-muted-foreground"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-1.5">
          Bio / Description <span className="text-muted-foreground font-normal">(optional but very helpful)</span>
        </label>
        <textarea
          placeholder="Describe their content, vibe, and personality..."
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          maxLength={300}
          className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-vault-cream text-sm placeholder:text-muted-foreground resize-none"
        />
        <p className="mt-1 text-xs text-muted-foreground text-right">{bio.length}/300</p>
      </div>

      {/* Constellation */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-1.5">
          Constellation <span className="text-muted-foreground font-normal">(which group do they fit?)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {constellations.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setConstellation(prev => prev === c.id ? '' : c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                constellation === c.id
                  ? 'border-current'
                  : 'border-border text-muted-foreground hover:text-vault-cream hover:border-vault-bronze/50'
              }`}
              style={constellation === c.id ? { borderColor: c.color, color: c.color, backgroundColor: `${c.color}18` } : {}}
            >
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: constellation === c.id ? c.color : '#666' }} />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-vault-cream mb-1.5">
          Vibe Tags <span className="text-muted-foreground font-normal">(up to 8)</span>
        </label>
        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
          {vibeTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'bg-vault-gold/20 border-vault-gold text-vault-gold'
                  : 'bg-muted/20 border-border text-muted-foreground hover:border-vault-bronze/50'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{selectedTags.length}/8 selected</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="border-border text-vault-cream">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!isValid || submitting || !user}
          className="flex-1 bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Submit VTuber
        </Button>
      </div>
    </form>
  )
}
