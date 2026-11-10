'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { VTUBER_SUBMIT } from '@/lib/site-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react'

interface VTuberSubmitFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

type LookupDuplicate = {
  status: 'match' | 'pending' | 'unsure'
  id: string | null
  name: string | null
}

export function VTuberSubmitForm({ onSuccess, onCancel }: VTuberSubmitFormProps) {
  const { user } = useAuth()
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
  const [lookupAvatar, setLookupAvatar] = useState<string | null>(null)
  const [avatarCleared, setAvatarCleared] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupMessage, setLookupMessage] = useState('')
  const [duplicate, setDuplicate] = useState<LookupDuplicate | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const touchedRef = useRef({ name: false, handle: false, platform: false, bio: false })
  const lastLookupUrlRef = useRef('')

  const constellations = ['clust_chaos', 'clust_cyber', 'clust_fantasy', 'clust_slice_of_life', 'clust_music']
  const vibeTagOptions = ['wholesome', 'chaotic', 'unhinged', 'cozy', 'competitive', 'artistic', 'meme', 'chill']

  const shownAvatar = avatarPreview || (!avatarFile && !avatarCleared ? lookupAvatar : null)

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (field === 'name' || field === 'handle' || field === 'platform' || field === 'bio') {
      touchedRef.current[field] = true
    }
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
    setAvatarCleared(false)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setError('')
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarCleared(true)
  }

  const toggleVibeTag = (tag: string) => {
    setSelectedVibeTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag].slice(0, 8)
    )
  }

  useEffect(() => {
    const url = formData.link.trim()
    if (!user || !url) {
      setLookupLoading(false)
      return
    }
    if (url === lastLookupUrlRef.current) return

    let cancelled = false
    const handle = window.setTimeout(() => {
      lastLookupUrlRef.current = url
      setLookupLoading(true)
      setLookupMessage('')
      setDuplicate(null)

      fetch('/api/vtubers/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url }),
      })
        .then(async res => {
          const data = await res.json().catch(() => ({}))
          if (cancelled) return
          if (!res.ok) {
            if (res.status === 400) {
              setLookupMessage(typeof data.error === 'string' ? data.error : VTUBER_SUBMIT.pasteLink)
            } else if (res.status === 401) {
              setLookupMessage('You must be signed in to pull a profile.')
            } else {
              setLookupMessage(VTUBER_SUBMIT.lookupFailed)
            }
            return
          }
          setFormData(prev => {
            if (prev.link.trim() !== url) return prev
            return {
              ...prev,
              link: typeof data.link === 'string' && data.link ? data.link : prev.link,
              name: !touchedRef.current.name && data.name ? data.name : prev.name,
              handle: !touchedRef.current.handle && data.handle ? data.handle : prev.handle,
              platform: !touchedRef.current.platform && data.platform ? data.platform : prev.platform,
              bio: !touchedRef.current.bio ? (data.bio || '') : prev.bio,
            }
          })
          if (data.link && !cancelled) {
            lastLookupUrlRef.current = data.link
          }
          if (!avatarFile) {
            setLookupAvatar(typeof data.avatarUrl === 'string' && data.avatarUrl ? data.avatarUrl : null)
            setAvatarCleared(false)
          }
          setLookupMessage(typeof data.message === 'string' && data.message ? data.message : '')
          setDuplicate(data.duplicate && data.duplicate.status ? data.duplicate : null)
        })
        .catch(() => {
          if (!cancelled) setLookupMessage(VTUBER_SUBMIT.lookupFailed)
        })
        .finally(() => {
          if (!cancelled) setLookupLoading(false)
        })
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [formData.link, user, avatarFile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be signed in to submit')
      return
    }
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    if (duplicate?.status === 'match' || duplicate?.status === 'pending') {
      setError(
        duplicate.status === 'match' && duplicate.name
          ? VTUBER_SUBMIT.alreadyInVault(duplicate.name)
          : duplicate.name
            ? VTUBER_SUBMIT.alreadyNominated(duplicate.name)
            : VTUBER_SUBMIT.alreadyNominated('That creator'),
      )
      return
    }

    setSubmitting(true)
    setError('')

    try {
      let avatarUrl: string | null = null

      if (avatarFile) {
        setUploading(true)
        const uploadBody = new FormData()
        uploadBody.append('file', avatarFile)
        const uploadRes = await fetch('/api/vtubers/avatar', {
          method: 'POST',
          credentials: 'include',
          body: uploadBody,
        })
        const uploadData = await uploadRes.json().catch(() => ({})) as { error?: string; url?: string }
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || "Couldn't upload the profile picture. You can submit without one, or try a different image.")
        }
        avatarUrl = uploadData.url
        setUploading(false)
      }

      const allTags = [...(selectedConstellation ? [selectedConstellation] : []), ...selectedVibeTags]

      const res = await fetch('/api/vtubers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          tags: allTags,
          avatar_url: avatarUrl,
          skip_avatar: !avatarFile && avatarCleared,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Submission failed')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        setFormData({ name: '', handle: '', platform: 'Twitch', link: '', bio: '' })
        setSelectedConstellation('')
        setSelectedVibeTags([])
        setAvatarFile(null)
        setAvatarPreview(null)
        setLookupAvatar(null)
        setAvatarCleared(false)
        setLookupMessage('')
        setDuplicate(null)
        touchedRef.current = { name: false, handle: false, platform: false, bio: false }
        lastLookupUrlRef.current = ''
        setSuccess(false)
      }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-14 w-14 text-vault-gold mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-vault-cream mb-2">Submitted for review!</h3>
        <p className="text-muted-foreground">Your VTuber will appear on the maps once approved.</p>
      </div>
    )
  }

  const duplicateMessage = duplicate?.status === 'match' && duplicate.name
    ? VTUBER_SUBMIT.alreadyInVault(duplicate.name)
    : duplicate?.status === 'pending' && duplicate.name
      ? VTUBER_SUBMIT.alreadyNominated(duplicate.name)
      : duplicate?.status === 'unsure'
        ? 'That handle already matches more than one creator. An admin will sort it out.'
        : ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="link">{VTUBER_SUBMIT.pasteLink}</Label>
        <Input
          id="link"
          type="url"
          value={formData.link}
          onChange={(e) => handleInputChange('link', e.target.value)}
          placeholder="https://twitch.tv/…  https://youtube.com/@…  https://x.com/…"
          className="mt-2"
        />
        {lookupLoading && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            {VTUBER_SUBMIT.lookingUp}
          </p>
        )}
        {!lookupLoading && lookupMessage && (
          <p className="text-xs text-muted-foreground mt-2">{lookupMessage}</p>
        )}
        {!lookupLoading && duplicateMessage && (
          <p className="text-sm text-vault-gold mt-2">
            {duplicateMessage}
            {duplicate?.status === 'match' && duplicate.id && (
              <>
                {' '}
                <Link href={`/vtuber/${duplicate.id}`} className="underline underline-offset-2">
                  Open dossier
                </Link>
              </>
            )}
          </p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium">Profile Picture (optional)</Label>
        <div className="mt-2 flex items-center gap-4">
          {shownAvatar ? (
            <div className="relative">
              <img src={shownAvatar} alt="Preview" className="h-20 w-20 rounded-xl object-cover border" />
              <button
                type="button"
                onClick={removeAvatar}
                className="absolute -top-2 -right-2 bg-black rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label htmlFor="avatar-upload" className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border border-dashed hover:bg-muted/50">
              <div className="text-center">
                <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground mt-1 block">Upload</span>
              </div>
            </label>
          )}

          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload">
              <Button type="button" variant="outline" size="sm">
                Choose Image
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
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
            <option value="Twitter">Twitter</option>
          <option value="Twitch/YouTube">Twitch + YouTube</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <Label htmlFor="bio">Bio / Description</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Short description..."
          maxLength={300}
          rows={3}
        />
      </div>

      <div>
        <Label>Constellation (Vibe Group)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {constellations.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedConstellation(c)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                selectedConstellation === c
                  ? 'bg-vault-gold/20 border-vault-gold text-vault-gold'
                  : 'border-white/20 hover:bg-white/5'
              }`}
            >
              {c.replace('clust_', '')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Vibe Tags (max 8)</Label>
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
        <p className="text-xs text-muted-foreground mt-1">{selectedVibeTags.length}/8 selected</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 pt-2 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="border-border text-vault-cream">
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={submitting || uploading || lookupLoading || duplicate?.status === 'match' || duplicate?.status === 'pending' || duplicate?.status === 'unsure'}>
          {uploading ? 'Uploading image...' : submitting ? 'Submitting...' : 'Submit for Review'}
          {(submitting || uploading) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Submissions are reviewed before appearing on the maps.
      </p>
    </form>
  )
}
