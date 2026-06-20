'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { VTuber, Clip, Bet } from '@/lib/types'

// Temporary DbVTuber until full type migration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DbVTuber {
  id: string
  name: string
  handle?: string
  avatar_url?: string
  bio?: string
  platform?: string
  link?: string
  approved?: boolean
  vibe_tags?: string[]
  category?: string
}

function dbVTuberToType(db: DbVTuber): VTuber {
  return {
    id: db.id,
    name: db.name,
    handle: db.handle,
    avatarUrl: db.avatar_url,
    bio: db.bio,
    platform: db.platform,
    link: db.link,
    approved: db.approved,
    vibeTags: db.vibe_tags || [],
    category: db.category,
  }
}

export function useVTubers() {
  const [vtubers, setVtubers] = useState<VTuber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('vtubers')
      .select('*')
      .eq('approved', true)
      .then(({ data }: { data: DbVTuber[] | null }) => {
        setVtubers((data ?? []).map(r => dbVTuberToType(r)))
        setLoading(false)
      })
  }, [])

  return { vtubers, loading }
}

export function useClips() {
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Placeholder - will be replaced with real implementation
    setLoading(false)
  }, [])

  return { clips, loading }
}

export function useBets() {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Placeholder - will be replaced with real implementation
    setLoading(false)
  }, [])

  return { bets, loading }
}

export function useVTuberById(id: string) {
  const [vtuber, setVtuber] = useState<VTuber | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    
    supabase
      .from('vtubers')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }: { data: DbVTuber | null }) => {
        if (data) {
          setVtuber(dbVTuberToType(data))
        }
        setLoading(false)
      })
  }, [id])

  return { vtuber, loading }
}
