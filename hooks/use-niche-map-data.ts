'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { VTuber } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface NicheCluster {
  id: string
  name: string
  color: string
  position: { x: number; y: number }
}

interface UseNicheMapDataReturn {
  vtubers: VTuber[]
  clusters: NicheCluster[]
  loading: boolean
  error: string | null
}

// Simple clustering logic based on vibe tags
function assignNicheCluster(vibeTags: string[], clusters: NicheCluster[]): string {
  if (!vibeTags.length) return clusters[0]?.id || 'default'
  
  // Find cluster that best matches the tags
  let bestCluster = clusters[0]
  let bestScore = 0

  clusters.forEach(cluster => {
    const score = vibeTags.filter(tag => 
      cluster.name.toLowerCase().includes(tag.toLowerCase()) || 
      tag.toLowerCase().includes(cluster.name.toLowerCase())
    ).length
    
    if (score > bestScore) {
      bestScore = score
      bestCluster = cluster
    }
  })

  return bestCluster?.id || clusters[0]?.id || 'default'
}

export function useNicheMapData(): UseNicheMapDataReturn {
  const [vtubers, setVtubers] = useState<VTuber[]>([])
  const [clusters, setClusters] = useState<NicheCluster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Fetch VTubers
        const { data: vtuberData, error: vtError } = await supabase
          .from('vtubers')
          .select('*')
          .eq('approved', true)

        if (vtError) throw vtError

        // Fetch clusters (from canonical_tags where category = 'cluster')
        const { data: clusterData, error: clusterError } = await supabase
          .from('canonical_tags')
          .select('id, tag, color, position_x, position_y')
          .eq('category', 'cluster')
          .not('color', 'is', null)

        if (clusterError) throw clusterError

        const dbClusters: NicheCluster[] = (clusterData || []).map((c: any) => ({
          id: c.id,
          name: c.tag,
          color: c.color,
          position: { x: c.position_x || 0.5, y: c.position_y || 0.5 }
        }))

        // Map VTubers with niche cluster assignment
        const mappedVtubers = (vtuberData || []).map((vt: any) => {
          const nicheCluster = assignNicheCluster(vt.vibeTags ?? [], dbClusters)
          
          return {
            id: vt.id,
            name: vt.name,
            handle: vt.handle,
            avatarUrl: vt.avatar_url,
            bio: vt.bio,
            category: nicheCluster,
            vibeTags: vt.vibe_tags || [],
            platform: vt.platform,
            link: vt.link,
            approved: vt.approved,
          }
        })

        setVtubers(mappedVtubers)
        setClusters(dbClusters)
      } catch (err: any) {
        console.error('Niche map data error:', err)
        setError(err.message || 'Failed to load niche map data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return { vtubers, clusters, loading, error }
}
