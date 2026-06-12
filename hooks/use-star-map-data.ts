'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { VTuber, Constellation } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

// Place stars around a constellation center without overlapping
export function placeStars(
  members: VTuber[],
  cx: number,
  cy: number,
  starRadius: number = 12
): Array<{ vtuber: VTuber; x: number; y: number }> {
  const placed: Array<{ vtuber: VTuber; x: number; y: number }> = []
  const minDist = starRadius * 2.8 // minimum gap between star centers

  for (const vtuber of members) {
    let bestX = cx
    let bestY = cy
    let found = false

    // Try rings of increasing radius until we find a non-overlapping spot
    for (let ring = 1; ring <= 8 && !found; ring++) {
      const ringRadius = 55 + ring * 35
      const spotsInRing = Math.max(6, Math.floor((2 * Math.PI * ringRadius) / (minDist * 1.1)))

      for (let i = 0; i < spotsInRing && !found; i++) {
        const angle = (i / spotsInRing) * Math.PI * 2 + ring * 0.5
        const tx = cx + Math.cos(angle) * ringRadius
        const ty = cy + Math.sin(angle) * ringRadius

        // Check distance to all already-placed stars
        const overlaps = placed.some(
          (p) => Math.hypot(p.x - tx, p.y - ty) < minDist
        )

        if (!overlaps) {
          bestX = tx
          bestY = ty
          found = true
        }
      }
    }

    placed.push({ vtuber, x: bestX, y: bestY })
  }

  return placed
}

export function getVTubersByConstellationLive(vtubers: VTuber[], constellationId: string): VTuber[] {
  return vtubers.filter((v) => v.category === constellationId)
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
    async function load() {
      try {
        const [vtRes, clusterRes] = await Promise.all([
          supabase.from('vtubers').select('*').eq('approved', true),
          supabase
            .from('canonical_tags')
            .select('id, tag, color, position_x, position_y, description')
            .eq('category', 'cluster')
            .not('color', 'is', null)
            .not('position_x', 'is', null)
            .order('sort_order'),
        ])

        if (vtRes.error) throw vtRes.error
        if (clusterRes.error) throw clusterRes.error

        const mappedVtubers = (vtRes.data ?? []).map(
          (row: Record<string, unknown>) => rowToVTuber(row)
        )

        const mappedConstellations = (clusterRes.data ?? [])
          .map((r: Record<string, unknown>) => {
            if (!r.color || r.position_x == null || r.position_y == null) return null
            return {
              id: r.id as string,
              name: r.tag as string,
              description: (r.description as string) ?? '',
              position: { x: r.position_x as number, y: r.position_y as number },
              color: r.color as string,
            } as Constellation
          })
          .filter((c): c is Constellation => c !== null)
          .filter((c) => mappedVtubers.some((v) => v.category === c.id))

        setVtubers(mappedVtubers)
        setConstellations(mappedConstellations)
      } catch (err) {
        console.error('Star map error:', err)
        setError('Failed to load.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { vtubers, constellations, loading, error }
}
