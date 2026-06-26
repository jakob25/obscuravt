'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

/** Client-side ownership check — claimed_by or user_claimed_profiles via API. */
export function useOwnsVtuber(vtuberId: string, claimedBy: string | null) {
  const { user } = useAuth()
  const [owns, setOwns] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setOwns(false)
      setLoading(false)
      return
    }

    if (claimedBy === user.username) {
      setOwns(true)
      setLoading(false)
      return
    }

    let cancelled = false
    fetch('/api/profiles/claimed', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { profiles: [] })
      .then(data => {
        if (cancelled) return
        const ids = (data.profiles ?? []).map((p: { id: string }) => p.id)
        setOwns(ids.includes(vtuberId))
      })
      .catch(() => { if (!cancelled) setOwns(false) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [user, vtuberId, claimedBy])

  return { owns, loading }
}