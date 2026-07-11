'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { VaultFrame } from '@/components/vault/vault-frame'

interface NotificationItem {
  id: string
  created_at: string
  request: {
    id: string
    request_type: string
    game_or_activity: string
    on_stream: boolean
    availability: string | null
    contact_twitter: string | null
    contact_discord: string | null
    expires_at: string
  }
  requester: {
    id: string
    name: string
    avatar_url: string | null
  }
}

function formatExpiry(expiresAt: string) {
  const expiry = new Date(expiresAt).getTime()
  const now = Date.now()
  const diffMs = Math.max(0, expiry - now)
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 1) return 'expires soon'
  return `expires in ${diffDays} days`
}

export function CollabNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/collab/notifications', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    }
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const clearOne = async (id: string) => {
    const res = await fetch('/api/collab/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setItems(current => current.filter(item => item.id !== id))
    }
  }

  const clearAll = async () => {
    const res = await fetch('/api/collab/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ clear_all: true }),
    })
    if (res.ok) {
      setItems([])
    }
  }

  if (loading) {
    return <VaultFrame className="p-5"><p className="text-sm text-muted-foreground">Loading notifications…</p></VaultFrame>
  }

  return (
    <VaultFrame className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-vault-cream">Collab notifications</h3>
          <p className="text-xs text-muted-foreground">Matched requests from creators who share your tags.</p>
        </div>
        {items.length > 0 ? (
          <Button type="button" variant="outline" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No new collab requests matching your tags.</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="rounded-lg border border-border/60 bg-background/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {item.requester.avatar_url ? (
                    <img src={item.requester.avatar_url} alt={item.requester.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-sm text-vault-cream">
                      {item.requester.name.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-vault-cream">{item.requester.name}</p>
                    <p className="text-xs text-muted-foreground">{item.request.request_type} • {item.request.game_or_activity}</p>
                  </div>
                </div>
                <button type="button" onClick={() => clearOne(item.id)} className="text-xs text-muted-foreground hover:text-vault-cream" aria-label="Dismiss notification">
                  ×
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/50 px-2 py-1">{item.request.on_stream ? 'On stream' : 'Off stream'}</span>
                {item.request.availability ? <span className="rounded-full border border-border/50 px-2 py-1">{item.request.availability}</span> : null}
                <span className="rounded-full border border-border/50 px-2 py-1">{formatExpiry(item.request.expires_at)}</span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-vault-cream">
                {item.request.contact_twitter ? <p>Twitter/X: {item.request.contact_twitter}</p> : null}
                {item.request.contact_discord ? <p>Discord: {item.request.contact_discord}</p> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </VaultFrame>
  )
}
