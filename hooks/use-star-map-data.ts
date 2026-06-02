'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { VTuber, Constellation } from '@/lib/types'

// ── DB row types ──────────────────────────────────────────────────────────────

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

interface DbClusterTag {
  id: string
  tag: string
  category: string
  sort_order: number
  color: string | null
  position_x: number | null
  position_y: number | null
  description: string | null
}

// ── Mapper ────────────────────────────────────────────────────────────────────

export function rowToVTuber(row: Record<string, unknown>): VTuber {
  const tags = (row.tags as string[]) ?? []
  const clusterTag = tags.find((t) => t.startsWith('clust_')) ?? 'clust_variety'
  const externalLinks: VTuber['externalLinks'] = []
  if (row.link) {
    const p = ((row.platform as string) ?? '').toLowerCase()
    if (p.includes('twitch')) externalLinks.push({ platform: 'twitch', url: row.link as string })
    else if (p.includes('youtube')) externalLinks.push({ platform: 'youtube', url: row.link as string })
    else externalLinks.push({ platform: 'website', url: row.link as string })
  }
  return {
    id: row.id as string,
    name: row.name as string,
    avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(row.id as string)}&backgroundColor=d4a574`,
    vibeTags: tags.filter((t) => !t.startsWith('clust_')),
    category: clusterTag,
    externalLinks,
    timezone: '',
    interests: [],
    interestedInMaking: [],
    bio: (row.bio as string) ?? '',
    scraps: 0,
  }
}

function dbClusterToConstellation(row: DbClusterTag): Constellation | null {
  // Requires position and color from DB — no fallbacks, no hardcoding
  if (!row.color || row.position_x == null || row.position_y == null) return null
  return {
    id: row.id,
    name: row.tag,
    description: row.description ?? '',
    position: { x: row.position_x, y: row.position_y },
    color: row.color,
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface StarMapData {
  vtubers: VTuber[]
  constellations: Constellation[]
  loading: boolean
  error: string | null
}

export function useStarMapData(): StarMapData {
  const [vtubers, setVtubers] = useState<VTuber[]>([])
  const [constellations, setConstellations] = useState<Constellation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [vtRes, clusterRes] = await Promise.all([
          supabase.from('vtubers').select('*').eq('approved', true),
          supabase
            .from('canonical_tags')
            .select('id, tag, category, sort_order, color, position_x, position_y, description')
            .eq('category', 'cluster')
            .not('color', 'is', null)         // only clusters with metadata in DB
            .not('position_x', 'is', null)
            .order('sort_order'),
        ])

        if (vtRes.error) throw vtRes.error
        if (clusterRes.error) throw clusterRes.error

        const mappedVtubers = (vtRes.data ?? []).map((r) => rowToVTuber(r as Record<string, unknown>))

        const mappedConstellations = (clusterRes.data ?? [])
          .map((r) => dbClusterToConstellation(r as DbClusterTag))
          .filter((c): c is Constellation => c !== null)
          // Only show constellations that have at least one VTuber
          .filter((c) => mappedVtubers.some((v) => v.category === c.id))

        setVtubers(mappedVtubers)
        setConstellations(mappedConstellations)
      } catch (err) {
        console.error('Star map data error:', err)
        setError('Failed to load star map data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { vtubers, constellations, loading, error }
}

export function getVTubersByConstellationLive(vtubers: VTuber[], constellationId: string): VTuber[] {
  return vtubers.filter((v) => v.category === constellationId)
}
