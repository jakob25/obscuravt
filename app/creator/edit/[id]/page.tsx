'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function EditProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user, username } = useAuth()

  const vtuberId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [vtuber, setVtuber] = useState<any>(null)

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

    // Fetch VTuber and check ownership
    const fetchVtuber = async () => {
      try {
        const res = await fetch(`/api/vtubers/${vtuberId}`)
        if (!res.ok) throw new Error('Failed to load profile')

        const data = await res.json()

        if (data.claimed_by !== username) {
          router.push(`/vtuber/${vtuberId}`)
          return
        }

        setVtuber(data)
        setFormData({
          name: data.name || '',
          handle: data.handle || '',
          bio: data.bio || '',
          link: data.link || '',
          platform: data.platform || '',
        })
      } catch (err) {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchVtuber()
  }, [user, username, vtuberId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/vtubers/${vtuberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to save changes')

      router.push(`/vtuber/${vtuberId}`)
    } catch (err) {
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label>Handle</Label>
          <Input
            value={formData.handle}
            onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
          />
        </div>

        <div>
          <Label>Bio</Label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={5}
          />
        </div>

        <div>
          <Label>Channel Link</Label>
          <Input
            type="url"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
          />
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
