'use client'

import { useState } from 'react'
import { APP_VERSION, UPDATE_ANNOUNCEMENTS } from '@/lib/app-version'
import { Button } from '@/components/ui/button'
import { Sparkles, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface Props {
  onDismiss: () => void
}

export function UpdateAnnouncement({ onDismiss }: Props) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const update = UPDATE_ANNOUNCEMENTS[APP_VERSION]

  const dismiss = async () => {
    if (!user) { onDismiss(); return }
    setSaving(true)
    try {
      await fetch(`/api/users/${user.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ last_seen_version: APP_VERSION }),
      })
    } catch { /* non-blocking */ }
    setSaving(false)
    onDismiss()
  }

  if (!update) return null

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md vault-card rounded-2xl border border-vault-gold/25 p-6 relative">
        <button type="button" onClick={dismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-vault-cream">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-vault-gold" />
          <h2 className="text-lg font-bold text-vault-cream">{update.title}</h2>
        </div>
        <ul className="space-y-2 mb-6">
          {update.body.map(line => (
            <li key={line} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-vault-gold">›</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <Button onClick={dismiss} disabled={saving} className="w-full bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold">
          {saving ? 'Saving…' : 'Got it'}
        </Button>
      </div>
    </div>
  )
}