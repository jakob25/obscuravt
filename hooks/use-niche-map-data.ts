'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { VTuber, Constellation } from '@/lib/types'
import { rowToVTuber } from '@/hooks/use-star-map-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DbNicheCluster {
  id: string
  tag: string
  color: string | null
  position_x: number | null
  position_y: number | null
  description: string | null
  content_tag_ids: string[] | null
}

function assignNicheCluster(vtags: string[], clusters: DbNicheCluster[]): string | null {
  let best: string | null = null
  let bestScore = 0
  for (const c of clusters) {
    const score = (c.content_tag_ids ?? []).filter(t => vtags.includes(t)).length
    if (score > bestScore) { bestScore = score; best = c.id }
  }
  return best
}

interface NicheMapData {
  vtubers: VTuber[]
  constellations: Constellation[]
  loading: boolean
  error: string | null
}

export function useNicheMapData(): NicheMapData {
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
            .select('id, tag, color, position_x, position_y, description, content_tag_ids')
            .eq('category', 'niche_cluster')
            .not('color', 'is', null)
            .not('position_x', 'is', null)
            .order('sort_order'),
        ])

        if (vtRes.error) throw vtRes.error
        if (clusterRes.error) throw clusterRes.error

        const dbClusters = (clusterRes.data ?? []) as DbNicheCluster[]

        const mapped = (vtRes.data ?? [])
          .map((row: Record<string, unknown>) => {
            const vt = rowToVTuber(row)
            const nicheCluster = assignNicheCluster(vt.vibeTags, dbClusters)
            return { ...vt, category: nicheCluster ?? '' }
          })
          .filter(v => v.category !== '')

        const usedIds = new Set(mapped.map(v => v.category))
        const consts: Constellation[] = dbClusters
          .filter(c => usedIds.has(c.id) && c.color && c.position_x != null && c.position_y != null)
          .map(c => ({
            id: c.id,
            name: c.tag,
            description: c.description ?? '',
            position: { x: c.position_x!, y: c.position_y! },
            color: c.color!,
          }))

        setVtubers(mapped)
        setConstellations(consts)
      } catch (err) {
        console.error('Niche map error:', err)
        setError('Failed to load niche map.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { vtubers, constellations, loading, error }
}

export function getVTubersByNicheCluster(vtubers: VTuber[], clusterId: string): VTuber[] {
  return vtubers.filter(v => v.category === clusterId)
}
