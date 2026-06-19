'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'

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

        // Ownership check
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/vtubers/${vtuberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save changes')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/vtuber/${vtuberId}`)
      }, 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vault-gold mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-6">
          Changes saved! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              value={formData.handle}
              onChange={(e) => handleChange('handle', e.target.value)}
              placeholder="@yourhandle"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Bio / Description</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={6}
            placeholder="Tell people about yourself..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="platform">Platform</Label>
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
            <Input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => handleChange('link', e.target.value)}
              placeholder="https://twitch.tv/yourname"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <p className="text-xs text-white/50 mt-6 text-center">
        Changes will be visible on your public profile immediately.
      </p>
    </div>
  )
}
