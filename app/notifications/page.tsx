'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'

interface Notification {
  id: string
  username: string
  title: string
  message: string
  type: string
  related_id: string | null
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }

    fetch(`/api/notifications?username=${encodeURIComponent(user.username)}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((data: Notification[]) => { setNotifications(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user, authLoading, router])

  const markAllRead = async () => {
    if (!user) return
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mark_all: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  if (authLoading || !user) return null

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream">Notifications</GlitchHeading>
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-vault-gold/20 text-vault-gold text-xs font-medium">
              {unread} unread
            </span>
          )}
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}
            className="border-vault-bronze/50 text-vault-cream hover:border-vault-gold/40">
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">Bets, achievements, chaos — delivered here.</p>
      <VaultDivider className="mb-6" />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 vault-panel animate-pulse bg-muted/30" />)}
        </div>
      ) : notifications.length === 0 ? (
        <VaultPanel className="p-12 text-center">
          <p className="text-muted-foreground">Nothing yet. The Vault is quiet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Win a bet or earn a badge — we&apos;ll ping you.</p>
        </VaultPanel>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <button
              key={n.id}
              type="button"
              onClick={() => !n.is_read && markRead(n.id)}
              className={`w-full text-left transition-all hover:border-vault-gold/20 ${
                n.is_read ? 'opacity-60' : ''
              }`}
            >
              <VaultPanel className={`p-4 ${!n.is_read ? 'border-vault-gold/30' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-vault-cream text-sm">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  </div>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-vault-gold flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-2">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </VaultPanel>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}