'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ChevronDown } from 'lucide-react'

interface ClaimedProfile {
  id: string
  name: string
  avatar_url: string | null
}

export function ProfileSwitcher() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<ClaimedProfile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    fetch('/api/profiles/claimed', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.profiles?.length > 1) {
          setProfiles(data.profiles)
          setActiveId(data.activeId)
        }
      })
      .catch(() => {})
  }, [user])

  if (profiles.length < 2) return null

  const active = profiles.find(p => p.id === activeId) ?? profiles[0]

  const switchTo = async (id: string) => {
    await fetch('/api/profiles/claimed', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ activeVtuberId: id }),
    })
    setActiveId(id)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        data-nav-glitch
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs text-vault-cream hover:border-vault-gold/40"
      >
        {active?.avatar_url ? (
          <img src={active.avatar_url} alt="" className="h-5 w-5 rounded-full" />
        ) : (
          <span className="h-5 w-5 rounded-full bg-vault-gold/30 flex items-center justify-center text-[10px]">{active?.name?.[0]}</span>
        )}
        <span className="max-w-[100px] truncate">{active?.name}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 vault-card rounded-xl border border-border shadow-xl z-50 py-1">
          {profiles.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => switchTo(p.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 ${p.id === activeId ? 'text-vault-gold' : 'text-vault-cream'}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}