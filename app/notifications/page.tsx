'use client'

import { Bell, Clock } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="h-8 w-8 text-vault-gold" />
        <h1 className="text-4xl font-bold">Notifications</h1>
      </div>

      <div className="vault-card p-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-vault-navy">
          <Bell className="h-8 w-8 text-white/40" />
        </div>

        <h2 className="text-2xl font-semibold mb-3">No notifications yet</h2>
        <p className="text-white/60 max-w-md mx-auto">
          When you receive notifications (new claims, votes on your tags, clip activity, etc.), 
          they will appear here.
        </p>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-2 text-sm text-white/50">
            <Clock className="h-4 w-4" />
            Coming soon
          </div>
        </div>
      </div>
    </div>
  )
}
