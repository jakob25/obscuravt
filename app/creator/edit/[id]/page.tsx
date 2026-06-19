'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EditProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user, username } = useAuth()

  const vtuberId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    bio: '',
    link: '',
    platform: '',
  })

  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null)
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (!user || !username) {
      router.push('/login')
      return
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/vtubers/${vtuberId}`)
        if (!res.ok) throw new Error('Failed to load profile')

        const data = await res.json()

        if (data.claimed_by !== username) {
          router.push(`/vtuber/${vtuberId}`)
          return
        }

        setFormData({
          name: data.name || '',
          handle: data.handle || '',
          bio: data.bio || '',
          link: data.link || '',
          platform: data.platform || '',
        })

        setCurrentAvatar(data.avatar_url || null)
      } catch (err) {
        setError('Failed to load profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, username, vtuberId, router])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    setNewAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const removeNewAvatar = () => {
    setNewAvatarFile(null)
    setAvatarPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      let finalAvatarUrl = currentAvatar

      // Upload new avatar if selected
      if (newAvatarFile) {
        setUploadingAvatar(true)
        const fileExt = newAvatarFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('vtuber-avatars')
          .upload(fileName, newAvatarFile)

        if (uploadError) throw new Error('Failed to upload new avatar')

        const { data: urlData } = supabase.storage
          .from('vtuber-avatars')
          .getPublicUrl(fileName)

        finalAvatarUrl = urlData.publicUrl
        setUploadingAvatar(false)
      }

      const updatePayload = {
        ...formData,
        avatar_url: finalAvatarUrl,
      }

      const res = await fetch(`/api/vtubers/${vtuberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save changes')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/vtuber/${vtuberId}`)
      }, 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
      setUploadingAvatar(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading profile...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6">{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-lg mb-6">Saved! Redirecting...</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar Section */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Profile Picture</Label>
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="New avatar" className="h-24 w-24 rounded-2xl object-cover border" />
              ) : currentAvatar ? (
                <img src={currentAvatar} alt="Current avatar" className="h-24 w-24 rounded-2xl object-cover border" />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-[#1a1730] flex items-center justify-center text-4xl font-bold text-vault-deep border">
                  {formData.name.charAt(0) || '?'}
                </div>
              )}

              {(avatarPreview || currentAvatar) && (
                <button
                  type="button"
                  onClick={() => {
                    setNewAvatarFile(null)
                    setAvatarPreview(null)
                    setCurrentAvatar(null)
                  }}
                  className="absolute -top-2 -right-2 bg-black rounded-full p-1.5"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 text-sm">
                <Upload className="h-4 w-4" />
                Upload New Photo
                <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
              </label>
              <p className="text-xs text-white/50 mt-2">PNG or JPG, max 5MB</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="handle">Handle</Label>
            <Input id="handle" value={formData.handle} onChange={(e) => handleChange('handle', e.target.value)} placeholder="@yourhandle" />
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={formData.bio} onChange={(e) => handleChange('bio', e.target.value)} rows={6} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="platform">Main Platform</Label>
            <select
              id="platform"
              value={formData.platform}
              onChange={(e) => handleChange('platform', e.target.value)}
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
            <Input id="link" type="url" value={formData.link} onChange={(e) => handleChange('link', e.target.value)} />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 py-6 text-base">
          <Save className="h-5 w-5" />
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
}
