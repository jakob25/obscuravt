'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function ClaimProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user, username } = useAuth()

  const vtuberId = params.id as string

  const [proofLink, setProofLink] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <p className="mb-4">You need to be logged in to claim a profile.</p>
        <Button onClick={() => router.push('/login')}>Sign In</Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vtuberId,
          proofLink: proofLink || null,
          message: message || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit claim')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2">Claim Request Submitted!</h1>
        <p className="text-white/70 mb-6">
          Your request has been sent to the admin for review. You'll be notified once it's processed.
        </p>
        <Button onClick={() => router.push(`/vtuber/${vtuberId}`)}>
          Back to Profile
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Claim this Profile</h1>
      <p className="text-white/60 mb-8">
        Are you this VTuber? Submit a claim request for admin review.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="proofLink">Proof Link (Twitch / YouTube)</Label>
          <Input
            id="proofLink"
            type="url"
            placeholder="https://twitch.tv/yourchannel or YouTube link"
            value={proofLink}
            onChange={(e) => setProofLink(e.target.value)}
          />
          <p className="text-xs text-white/50 mt-1">
            Link to your channel or a stream where you mention this profile.
          </p>
        </div>

        <div>
          <Label htmlFor="message">Message (optional)</Label>
          <Textarea
            id="message"
            placeholder="Any additional information for the admin..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Claim Request'}
        </Button>

        <p className="text-xs text-center text-white/50">
          Your request will be reviewed manually.
        </p>
      </form>
    </div>
  )
}
