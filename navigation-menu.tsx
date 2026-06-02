'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Bell, Check, CheckCheck, Trophy, Star, Gift, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  related_id: string | null
  is_read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  bet_won: Trophy,
  bet_lost: AlertCircle,
  achievement: Star,
  daily_bonus: Gift,
  default: Bell,
}

const TYPE_COLORS: Record<string, string> = {
  bet_won: 'text-vault-gold',
  bet_lost: 'text-muted-foreground',
  achievement: 'text-vault-gold',
  daily_bonus: 'text-green-400',
  default: 'text-muted-foreground',
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetch(`/api/notifications?username=${user.username}`)
      .then(r => r.json())
      .then(data => { setNotifications(data); setLoading(false) })
  }, [user, router])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user?.username }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user?.username, notification_id: id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-vault-gold" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-vault-gold text-vault-deep text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-vault-cream">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            className="text-muted-foreground hover:text-vault-cream gap-1.5"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="vault-card rounded-xl p-4 h-20 animate-pulse bg-muted/20" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="vault-card rounded-xl p-12 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-vault-cream font-medium mb-1">No notifications yet</p>
          <p className="text-sm text-muted-foreground">
            Place bets and vote on outcomes to get notified when they resolve.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = TYPE_ICONS[n.type] ?? TYPE_ICONS.default
            const iconColor = TYPE_COLORS[n.type] ?? TYPE_COLORS.default

            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`vault-card rounded-xl p-4 flex items-start gap-4 cursor-pointer transition-all ${
                  !n.is_read
                    ? 'border-vault-gold/20 bg-vault-gold/3 hover:border-vault-gold/30'
                    : 'opacity-60 hover:opacity-80'
                }`}
              >
                <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium text-sm ${!n.is_read ? 'text-vault-cream' : 'text-muted-foreground'}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                      {!n.is_read && (
                        <div className="h-2 w-2 rounded-full bg-vault-gold flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                  {n.related_id && n.type.startsWith('bet') && (
                    <Link
                      href="/bets"
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-vault-gold hover:underline mt-1 inline-block"
                    >
                      View bet →
                    </Link>
                  )}
                  {n.related_id && n.type === 'achievement' && (
                    <Link
                      href="/achievements"
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-vault-gold hover:underline mt-1 inline-block"
                    >
                      View achievement →
                    </Link>
                  )}
                </div>
                {n.is_read && <Check className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
