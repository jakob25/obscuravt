'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { MAX_CIRCLE_SIZE } from '@/lib/types'

interface Props {
  vtuberId: string
  vtuberName: string
}

function parseIds(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

export function AddToCircleButton({ vtuberId, vtuberName }: Props) {
  const { user } = useAuth()
  const [inCircle, setInCircle] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    const res = await fetch(`/api/users/${user.username}`, { credentials: 'include' })
    if (!res.ok) return
    const data = await res.json()
    const ids = parseIds(data.favorite_vtubers)
    setCount(ids.length)
    setInCircle(ids.includes(vtuberId))
  }, [user, vtuberId])

  useEffect(() => { load() }, [load])

  if (!user) return null

  const toggle = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`/api/users/${user.username}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Could not load profile')
      const data = await res.json()
      let ids = parseIds(data.favorite_vtubers)

      if (inCircle) {
        ids = ids.filter(id => id !== vtuberId)
      } else {
        if (ids.length >= MAX_CIRCLE_SIZE) {
          setMessage(`Circle full (${MAX_CIRCLE_SIZE} max). Remove someone first.`)
          setLoading(false)
          return
        }
        if (!ids.includes(vtuberId)) ids.push(vtuberId)
      }

      const patch = await fetch(`/api/users/${user.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ favorite_vtubers: ids.join(',') }),
      })
      if (!patch.ok) {
        const err = await patch.json()
        throw new Error(err.error ?? 'Update failed')
      }

      setInCircle(!inCircle)
      setCount(ids.length)
      setMessage(inCircle ? `Removed ${vtuberName}` : `Added ${vtuberName} to your Circle`)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-60 ${
          inCircle
            ? 'bg-vault-gold/15 border-vault-gold/40 text-vault-gold hover:bg-vault-gold/25'
            : 'border-border text-vault-cream hover:border-vault-gold/40 hover:text-vault-gold'
        }`}
      >
        {loading ? '…' : inCircle ? 'In your Circle' : 'Add to Circle'}
      </button>
      <span className="text-[10px] text-muted-foreground">{count}/{MAX_CIRCLE_SIZE} in Circle</span>
      {message && <p className="text-[10px] text-vault-gold max-w-[160px] text-right">{message}</p>}
    </div>
  )
}