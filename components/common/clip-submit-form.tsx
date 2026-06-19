'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@supabase/supabase-js'
import { Upload, X, Loader2 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ClipSubmitFormProps {
  prefillVtuberId?: string
  onSuccess?: () => void
  onClose?: () => void
  onCancel?: () => void
}

export function ClipSubmitForm({ prefillVtuberId, onSuccess, onClose, onCancel }: ClipSubmitFormProps) {
  const { user, username } = useAuth()
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState<'twitch' | 'youtube'>('twitch')
  const [videoId, setVideoId] = useState('')
  const [selectedVibeTags, setSelectedVibeTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const vibeTagOptions = ['wholesome', 'chaotic', 'unhinged', 'cozy', 'competitive', 'artistic', 'meme', 'chill']

  const handleClose = () => {
    if (onClose) onClose()
    if (onCancel) onCancel()
  }

  const toggleVibeTag = (tag: string) => {
    setSelectedVibeTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag].slice(0, 5)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !title || !videoId) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          platform,
          video_id: videoId,
          vibe_tags: selectedVibeTags,
          submitted_by: username,
          prefill_vtuber_id: prefillVtuberId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit clip')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        handleClose()
        setTitle('')
        setVideoId('')
        setSelectedVibeTags([])
        setSuccess(false)
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-semibold text-vault-cream mb-2">Clip submitted!</h3>
        <p className="text-muted-foreground">Thank you for contributing.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label>Title *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Clip title or description"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Platform</Label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as 'twitch' | 'youtube')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="twitch">Twitch</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>
        <div>
          <Label>Video ID / URL *</Label>
          <Input
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Video ID or full URL"
            required
          />
        </div>
      </div>

      <div>
        <Label>Vibe Tags (max 5)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {vibeTagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleVibeTag(tag)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                selectedVibeTags.includes(tag)
                  ? 'bg-vault-gold text-vault-deep border-vault-gold'
                  : 'border-white/20 hover:bg-white/5'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Clip'}
          {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
