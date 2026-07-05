'use client'

import { useState, useEffect, useRef } from 'react'
import type { VTuber, Constellation } from '@/lib/types'
import { getSupabaseClient } from '@/lib/supabase'

const supabase = getSupabaseClient()

// ── Module-level cache — survives re-mounts, cleared on tab close ──────────
// Prevents re-fetching when user navigates away and back to /discover.
interface CacheEntry {
  vtubers: VTuber[]
  constellations: Constellation[]
  ts: number
}
let _cache: CacheEntry | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

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

  const avatarUrl =
    (row.avatar_url as string) ||
    `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(row.id as string)}&backgroundColor=d4a574`

  return {
    id: row.id as string,
    name: row.name as string,
    avatarUrl,
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

export function getVTubersByConstellationLive(vtubers: VTuber[], constellationId: string): VTuber[] {
  return vtubers.filter((v) => v.category === constellationId)
}

interface StarMapData {
  vtubers: VTuber[]
  constellations: Constellation[]
  // Pre-built lookup: constellationId → VTuber[] — avoids per-frame filter in the render loop
  memberMap: Map<string, VTuber[]>
  loading: boolean
  error: string | null
}

export function useStarMapData(): StarMapData {
  const [vtubers, setVtubers] = useState<VTuber[]>(_cache?.vtubers ?? [])
  const [constellations, setConstellations] = useState<Constellation[]>(_cache?.constellations ?? [])
  const [memberMap, setMemberMap] = useState<Map<string, VTuber[]>>(() => buildMemberMap(_cache?.vtubers ?? [], _cache?.constellations ?? []))
  const [loading, setLoading] = useState(_cache === null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Cache hit — nothing to do
    if (_cache && Date.now() - _cache.ts < CACHE_TTL_MS) {
      setLoading(false)
      return
    }

    abortRef.current = new AbortController()

    async function load() {
      try {
        // Only select columns the star map actually uses — not select('*')
        const [vtRes, clusterRes] = await Promise.all([
          supabase
            .from('vtubers')
            .select('id, name, bio, avatar_url, link, platform, tags')
            .eq('approved', true),
          supabase
            .from('canonical_tags')
            .select('id, tag, color, position_x, position_y, description')
            .eq('category', 'cluster')
            .not('color', 'is', null)
            .not('position_x', 'is', null)
            .order('sort_order'),
        ])

        if (abortRef.current?.signal.aborted) return
        if (vtRes.error) throw vtRes.error
        if (clusterRes.error) throw clusterRes.error

        const mappedVtubers = (vtRes.data ?? []).map(
          (row: Record<string, unknown>) => rowToVTuber(row)
        )

        // Build a Set of occupied cluster IDs for O(1) lookup instead of O(n) .some()
        const occupiedClusters = new Set(mappedVtubers.map((v) => v.category))

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
          .filter((c) => occupiedClusters.has(c.id))

        const map = buildMemberMap(mappedVtubers, mappedConstellations)

        _cache = { vtubers: mappedVtubers, constellations: mappedConstellations, ts: Date.now() }

        setVtubers(mappedVtubers)
        setConstellations(mappedConstellations)
        setMemberMap(map)
      } catch (err) {
        if (!abortRef.current?.signal.aborted) {
          console.error('Star map error:', err)
          setError('Failed to load.')
        }
      } finally {
        if (!abortRef.current?.signal.aborted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => { abortRef.current?.abort() }
  }, [])

  return { vtubers, constellations, memberMap, loading, error }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildMemberMap(vtubers: VTuber[], constellations: Constellation[]): Map<string, VTuber[]> {
  const map = new Map<string, VTuber[]>()
  constellations.forEach((c) => map.set(c.id, []))
  vtubers.forEach((v) => {
    const bucket = map.get(v.category)
    if (bucket) bucket.push(v)
  })
  return map
}
