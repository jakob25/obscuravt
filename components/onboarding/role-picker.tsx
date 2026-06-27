'use client'

import { useState } from 'react'
import { ROLES, ROLE_LABELS, type AppRole } from '@/lib/roles'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

interface Props {
  onComplete: () => void
}

export function RolePicker({ onComplete }: Props) {
  const { user, refreshUser } = useAuth()
  const [selected, setSelected] = useState<AppRole | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!user || !selected) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/users/${user.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save role')
      await refreshUser()
      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg vault-card rounded-2xl border border-vault-gold/30 p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-vault-cream mb-1">Welcome to the Vault</h2>
        <p className="text-sm text-muted-foreground mb-6">Pick your role — you can change this later in My Profile.</p>

        <div className="space-y-2 mb-6">
          {ROLES.map(role => (
            <button
              key={role}
              type="button"
              onClick={() => setSelected(role)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected === role
                  ? 'border-vault-gold bg-vault-gold/10'
                  : 'border-border hover:border-vault-bronze/50'
              }`}
            >
              <p className="font-semibold text-vault-cream">{role}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[role]}</p>
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        <Button
          onClick={save}
          disabled={!selected || saving}
          className="w-full bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold"
        >
          {saving ? 'Saving…' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}