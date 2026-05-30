'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { VTuber, Constellation } from '@/lib/types'

// Constellation layout positions and colors keyed by cluster ID
const CLUSTER_META: Record<string, { position: { x: number; y: number }; color: string; description: string }> = {
  clust_chaos:        { position: { x: 150, y: 120 }, color: '#cc6b3d', description: 'Unhinged gremlin high-energy streamers' },
  clust_comfy:        { position: { x: 620, y: 180 }, color: '#8b7355', description: 'Comfy wholesome chill vibes' },
  clust_stem:         { position: { x: 120, y: 420 }, color: '#6b8e8b', description: 'STEM science and educational content' },
  clust_horror:       { position: { x: 780, y: 500 }, color: '#3d2b4f', description: 'Horror dark aesthetic grotesque content' },
  clust_idol:         { position: { x: 450, y: 80  }, color: '#d4a574', description: 'Idol music and performance focused' },
  clust_gaming:       { position: { x: 820, y: 300 }, color: '#4a7c6f', description: 'Competitive and variety gaming' },
  clust_worker:       { position: { x: 280, y: 520 }, color: '#7a8c6e', description: 'Worker VTubers with real-world skills' },
  clust_variety:      { position: { x: 500, y: 380 }, color: '#b8860b', description: 'Variety streamers defying categories' },
  clust_menhara:      { position: { x: 700, y: 650 }, color: '#9b59b6', description: 'Emotionally intense yandere-coded menhara energy' },
  clust_denpa:        { position: { x: 200, y: 650 }, color: '#e056a0', description: 'Glitchy otaku-core denpa internet-poisoned aesthetic' },
  clust_vsinger:      { position: { x: 450, y: 600 }, color: '#f0c040', description: 'Original music karaoke and music-first creators' },
  clust_experimental: { position: { x: 900, y: 150 }, color: '#3ae0c0', description: 'Format-breaking innovative stream experimenters' },
}

// Map a DB row to the VTuber type the star map expects
function rowToVTuber(row: Record<string, unknown>): VTuber {
  const tags = (row.tags as string[]) ?? []

  // The cluster tag is the first clust_* tag in the array
  const clusterTag = tags.find((t) => t.startsWith('clust_')) ?? 'clust_variety'

  // Build external links from platform + link fields
  const externalLinks: VTuber['externalLinks'] = []
  const platform = (row.platform as string) ?? ''
  const link = (row.link as string) ?? ''

  if (link) {
    if (platform.toLowerCase().includes('twitch')) {
      externalLinks.push({ platform: 'twitch', url: link })
    } else if (platform.toLowerCase().includes('youtube')) {
      externalLinks.push({ platform: 'youtube', url: link })
    } else {
      externalLinks.push({ platform: 'website', url: link })
    }
  }

  // Handle dual platforms (e.g. "Twitch/YouTube")
  if (platform.toLowerCase().includes('twitch') && platform.toLowerCase().includes('youtube') && link) {
    // Already added one, add a generic twitter/website placeholder so profile shows both
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

// Map a canonical_tags cluster row to a Constellation
function clusterToConstellation(row: Record<string, unknown>): Constellation | null {
  const id = row.id as string
  const meta = CLUSTER_META[id]
  if (!meta) return null

  return {
    id,
    name: row.tag as string,
    description: meta.description,
    position: meta.position,
    color: meta.color,
  }
}

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
    async function fetch() {
      try {
        // Fetch in parallel
        const [vtRes, clustRes] = await Promise.all([
          supabase.from('vtubers').select('*').eq('approved', true),
          supabase.from('canonical_tags').select('*').eq('category', 'cluster').order('sort_order'),
        ])

        if (vtRes.error) throw vtRes.error
        if (clustRes.error) throw clustRes.error

        const mappedVtubers = (vtRes.data ?? []).map((row) =>
          rowToVTuber(row as Record<string, unknown>)
        )

        const mappedConstellations = (clustRes.data ?? [])
          .map((row) => clusterToConstellation(row as Record<string, unknown>))
          .filter((c: Constellation | null): c is Constellation => c !== null)
          // Only include constellations that actually have VTubers
          .filter((c) => mappedVtubers.some((v) => v.category === c.id))

        setVtubers(mappedVtubers)
        setConstellations(mappedConstellations)
      } catch (err) {
        console.error('Star map data fetch error:', err)
        setError('Failed to load star map data.')
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [])

  return { vtubers, constellations, loading, error }
}

// Helpers that mirror the mock-data ones, used by the star map canvas
export function getVTubersByConstellationLive(
  vtubers: VTuber[],
  constellationId: string
): VTuber[] {
  return vtubers.filter((v) => v.category === constellationId)
}
