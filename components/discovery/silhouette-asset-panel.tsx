'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useOwnsVtuber } from '@/hooks/use-owns-vtuber'
import { ImageUploadField } from '@/components/common/image-upload-field'
import { Eye, Loader2 } from 'lucide-react'

const ADMINS = ['jakob25', 'admin']

interface Props {
  vtuberId: string
  vtuberName: string
  claimedBy: string | null
  initialSilhouetteUrl: string | null
}

export function SilhouetteAssetPanel({ vtuberId, vtuberName, claimedBy, initialSilhouetteUrl }: Props) {
  const { user } = useAuth()
  const { owns } = useOwnsVtuber(vtuberId, claimedBy)
  const isAdmin = user ? ADMINS.includes(user.username) : false
  const canEdit = user && (owns || isAdmin)

  const [silhouetteUrl, setSilhouetteUrl] = useState(initialSilhouetteUrl)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  if (!canEdit) return null

  const save = async (url: string | null) => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/discovery-games/silhouette', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ vtuberId, silhouette_url: url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setSilhouetteUrl(url)
      setMessage(url ? 'Silhouette saved for Who Is This?' : 'Silhouette removed.')
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 p-4 rounded-lg border border-vault-bronze/30 bg-vault-deep/40">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="h-4 w-4 text-vault-gold" />
        <h3 className="text-sm font-semibold text-vault-cream">Discovery silhouette</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Upload a black silhouette image for {vtuberName}. Fans guess who it is in the Who Is This? game.
      </p>
      {silhouetteUrl && (
        <div className="mb-3 flex justify-center">
          <img
            src={silhouetteUrl}
            alt={`${vtuberName} silhouette`}
            className="h-24 w-24 object-contain rounded-lg border border-border bg-black"
          />
        </div>
      )}
      <ImageUploadField
        purpose="silhouette"
        label="Upload silhouette (PNG recommended)"
        onUploaded={url => save(url)}
        onClear={() => save(null)}
        disabled={saving}
      />
      {saving && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
        </p>
      )}
      {message && <p className="text-xs text-vault-gold mt-2">{message}</p>}
    </div>
  )
}