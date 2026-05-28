'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { VTuber, Constellation, Clip, Bet, BetOption, VibeTag } from '@/lib/types'

// ── Types matching Supabase rows ──────────────────────────────────────────────

interface DbVTuber {
  id: string
  name: string
  handle: string
  platform: string
  link: string
  bio: string
  tags: string[]
  approved: boolean
  spotlight: boolean
}

interface DbBet {
  id: string
  title: string
  description: string
  vtuber_name: string
  options: string[]
  status: string
  created_at: string
  result: string | null
  category: string
}

interface DbBetEntry {
  option: string
  amount: number
}

interface DbClip {
  id: string
  profile_id: string | null
  username: string
  title: string
  url: string
  thumbnail_url: string | null
  views: number
  created_at: string
}

interface DbCanonicalTag {
  id: string
  tag: string
  category: string
  sort_order: number
}

// ── Mappers ───────────────────────────────────────────────────────────────────

export function dbVTuberToType(row: DbVTuber): VTuber {
  const clusterTag = (row.tags ?? []).find((t: string) => t.startsWith('clust_')) ?? 'clust_variety'
  const externalLinks: VTuber['externalLinks'] = []
  if (row.link) {
    const p = row.platform?.toLowerCase() ?? ''
    if (p.includes('twitch')) externalLinks.push({ platform: 'twitch', url: row.link })
    else if (p.includes('youtube')) externalLinks.push({ platform: 'youtube', url: row.link })
    else externalLinks.push({ platform: 'website', url: row.link })
  }
  return {
    id: row.id,
    name: row.name,
    avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(row.id)}&backgroundColor=d4a574`,
    vibeTags: (row.tags ?? []).filter((t: string) => !t.startsWith('clust_')),
    category: clusterTag,
    externalLinks,
    timezone: '',
    interests: [],
    interestedInMaking: [],
    bio: row.bio ?? '',
    scraps: 0,
  }
}

export function dbTagToVibeTag(row: DbCanonicalTag): VibeTag {
  const colorMap: Record<string, string> = {
    vibe: '#d4a574',
    content: '#c9a227',
    cluster: '#8b7355',
  }
  return {
    id: row.id,
    name: row.tag,
    category: row.category === 'vibe' ? 'personality' : row.category === 'content' ? 'content' : 'theme',
    color: colorMap[row.category] ?? '#888',
  }
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useVTubers() {
  const [vtubers, setVtubers] = useState<VTuber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('vtubers')
      .select('*')
      .eq('approved', true)
      .then(({ data }) => {
        setVtubers((data ?? []).map(r => dbVTuberToType(r as DbVTuber)))
        setLoading(false)
      })
  }, [])

  return { vtubers, loading }
}

export function useVTuberById(id: string) {
  const [vtuber, setVtuber] = useState<VTuber | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('vtubers')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setVtuber(data ? dbVTuberToType(data as DbVTuber) : null)
        setLoading(false)
      })
  }, [id])

  return { vtuber, loading }
}

export function useVibeTags() {
  const [vibeTags, setVibeTags] = useState<VibeTag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('canonical_tags')
      .select('*')
      .in('category', ['vibe', 'content'])
      .order('sort_order')
      .then(({ data }) => {
        setVibeTags((data ?? []).map(r => dbTagToVibeTag(r as DbCanonicalTag)))
        setLoading(false)
      })
  }, [])

  return { vibeTags, loading }
}

export function useBets() {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: betRows } = await supabase
        .from('bets')
        .select('*')
        .order('created_at', { ascending: false })

      if (!betRows) { setLoading(false); return }

      // For each bet get entry totals per option
      const mapped: Bet[] = await Promise.all(
        betRows.map(async (b: DbBet) => {
          const { data: entries } = await supabase
            .from('bet_entries')
            .select('option, amount')
            .eq('bet_id', b.id)

          const totals: Record<string, number> = {}
          ;(entries ?? []).forEach((e: DbBetEntry) => {
            totals[e.option] = (totals[e.option] ?? 0) + e.amount
          })

          const options: BetOption[] = (b.options ?? []).map((label: string, i: number) => ({
            id: `${b.id}-opt-${i}`,
            label,
            odds: 1,
            totalScraps: totals[label] ?? 0,
          }))

          return {
            id: b.id,
            title: b.title,
            description: b.description ?? '',
            vtuberId: undefined,
            options,
            status: b.status as Bet['status'],
            endsAt: b.created_at,
            createdAt: b.created_at,
          }
        })
      )

      setBets(mapped)
      setLoading(false)
    }
    load()
  }, [])

  return { bets, loading }
}

export function useClips() {
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('clips')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const mapped: Clip[] = (data ?? []).map((c: DbClip) => ({
          id: c.id,
          vtuberId: c.profile_id ?? '',
          title: c.title,
          platform: c.url?.includes('youtube') ? 'youtube' : 'twitch',
          videoId: c.url ?? '',
          vibeTags: [],
          type: 'raw' as const,
          submittedBy: c.username,
          votes: { up: c.views ?? 0, down: 0 },
          createdAt: c.created_at,
        }))
        setClips(mapped)
        setLoading(false)
      })
  }, [])

  return { clips, loading }
}