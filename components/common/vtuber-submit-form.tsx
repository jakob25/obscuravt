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

interface VTuberSubmitFormProps {
  onSuccess?: () => void
  onClose?: () => void
  onCancel?: () => void
}

export function VTuberSubmitForm({ onSuccess, onClose, onCancel }: VTuberSubmitFormProps) {
  const { user, username } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    platform: 'Twitch',
    link: '',
    bio: '',
  })
  const [selectedConstellation, setSelectedConstellation] = useState('')
  const [selectedVibeTags, setSelectedVibeTags] = useState<string[]>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const constellations = ['clust_chaos', 'clust_cyber', 'clust_fantasy', 'clust_slice_of_life', 'clust_music']
  const vibeTagOptions = ['wholesome', 'chaotic', 'unhinged', 'cozy', 'competitive', 'artistic', 'meme', 'chill']

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setError('')
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const toggleVibeTag = (tag: string) => {
    setSelectedVibeTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag].slice(0, 8)
    )
  }

  const handleClose = () => {
    if (onClose) onClose()
    if (onCancel) onCancel()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username) {
      setError('You must be signed in to submit')
      return
    }
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      let avatarUrl: string | null = null

      if (avatarFile) {
        setUploading(true)
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('vtuber-avatars')
          .upload(fileName, avatarFile, { upsert: false })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('vtuber-avatars')
          .getPublicUrl(fileName)

        avatarUrl = urlData.publicUrl
        setUploading(false)
      }

      const allTags = [...(selectedConstellation ? [selectedConstellation] : []), ...selectedVibeTags]

      const res = await fetch('/api/vtubers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: allTags,
          avatar_url: avatarUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Submission failed')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        handleClose()
        setFormData({ name: '', handle: '', platform: 'Twitch', link: '', bio: '' })
        setSelectedConstellation('')
        setSelectedVibeTags([])
        setAvatarFile(null)
        setAvatarPreview(null)
        setSuccess(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-semibold text-vault-cream mb-2">Submitted for review!</h3>
        <p className="text-muted-foreground">Your VTuber will appear on the maps once approved.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Upload */}
      <div>
        <Label className="text-sm font-medium">Profile Picture (optional)</Label>
        <div className="mt-3 flex items-start gap-4">
          <div>
            {avatarPreview ? (
              <div className="relative">
                <img src={avatarPreview} alt="Preview" className="h-20 w-20 rounded-xl object-cover border" />
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 bg-black rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="h-20 w-20 rounded-xl border border-dashed flex items-center justify-center text-muted-foreground">
                <Upload className="h-6 w-6" />
              </div>
            )}
          </div>

          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>Choose Image</span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-1.5">PNG or JPG up to 5MB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="VTuber name"
            required
          />
        </div>
        <div>
          <Label htmlFor="handle">Handle</Label>
          <Input
            id="handle"
            value={formData.handle}
            onChange={(e) => handleInputChange('handle', e.target.value)}
            placeholder="@username"
          />
        </div>
      </div>

      <div>
        <Label>Platform</Label>
        <select
          value={formData.platform}
          onChange={(e) => handleInputChange('platform', e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="Twitch">Twitch</option>
          <option value="YouTube">YouTube</option>
          <option value="Twitch/YouTube">Twitch + YouTube</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <Label htmlFor="link">Channel Link</Label>
        <Input
          id="link"
          type="url"
          value={formData.link}
          onChange={(e) => handleInputChange('link', e.target.value)}
          placeholder="https://twitch.tv/..."
        />
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Short description..."
          maxLength={300}
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting || uploading}>
          {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit for Review'}
          {(submitting || uploading) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>
    </form>
  )
}
