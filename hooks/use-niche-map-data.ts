'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { VTuber, Constellation } from '@/lib/types'
import { rowToVTuber } from '@/hooks/use-star-map-data'

interface DbNicheCluster {
  id: string
  tag: string
  color: string | null
  position_x: number | null
  position_y: number | null
  description: string | null
  content_tag_ids: string[] | null   // ← from DB, no hardcoding
  sort_order: number
}

// Assign a VTuber to a niche cluster based purely on DB-driven content tag mappings
function assignNicheCluster(
  vtags: string[],
  clusters: DbNicheCluster[]
): string | null {
  let bestCluster: string | null = null
  let bestScore = 0

  for (const cluster of clusters) {
    const contentTags = cluster.content_tag_ids ?? []
    const score = contentTags.filter(t => vtags.includes(t)).length
    if (score > bestScore) {
      bestScore = score
      bestCluster = cluster.id
    }
  }

  return bestCluster
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
            .select('id, tag, color, position_x, position_y, description, content_tag_ids, sort_order')
            .eq('category', 'niche_cluster')
            .not('color', 'is', null)
            .not('position_x', 'is', null)
            .order('sort_order'),
        ])

        if (vtRes.error) throw vtRes.error
        if (clusterRes.error) throw clusterRes.error

        const dbClusters = (clusterRes.data ?? []) as DbNicheCluster[]

        // Map VTubers, overriding category with niche cluster
        const mapped = (vtRes.data ?? [])
          .map((row) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const vt = rowToVTuber(row as any)
            const nicheCluster = assignNicheCluster(vt.vibeTags, dbClusters)
            return { ...vt, category: nicheCluster ?? '' }
          })
          .filter(v => v.category !== '') // drop VTubers with no niche match

        // Build constellations from DB rows, only include ones with VTubers
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
