'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { VTuber, Constellation } from '@/lib/types'
import { rowToVTuber } from '@/hooks/use-star-map-data'

// Demo / fallback data for testing environment and when Supabase has no (or incomplete) niche_cluster rows.
// This ensures the Niche Map ALWAYS renders stars (individual creators) when zoomed in.
const SAMPLE_NICHE_CONSTELLATIONS: Constellation[] = [
  { id: 'just_chatting', name: 'Just Chatting', description: 'IRL, zatsudan, talking streams', position: { x: -220, y: -140 }, color: '#eab308' },
  { id: 'gameplay', name: 'Gameplay', description: 'Specific games or variety gaming', position: { x: 180, y: -90 }, color: '#22c55e' },
  { id: 'music', name: 'Music & Karaoke', description: 'Singing, instruments, covers', position: { x: -30, y: 210 }, color: '#a78bfa' },
  { id: 'creative', name: 'Creative / Art', description: 'Drawing, crafts, design streams', position: { x: 260, y: 130 }, color: '#ec4899' },
  { id: 'asmr', name: 'ASMR & Chill', description: 'Relaxing, soft spoken, triggers', position: { x: 40, y: -210 }, color: '#14b8a6' },
]

const SAMPLE_VTUBERS: VTuber[] = [
  { id: 'demo_talk1', name: 'CozyChat', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=demo_talk1&backgroundColor=d4a574', vibeTags: ['talk', 'wholesome', 'cozy'], category: 'just_chatting', externalLinks: [], timezone: '', interests: [], interestedInMaking: [], bio: 'Cozy just chatting streams', scraps: 0 },
  { id: 'demo_talk2', name: 'ZatsuQueen', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=demo_talk2&backgroundColor=d4a574', vibeTags: ['chat', 'irl', 'hyper'], category: 'just_chatting', externalLinks: [], timezone: '', interests: [], interestedInMaking: [], bio: 'Late night zatsudan', scraps: 0 },
  { id: 'demo_game1', name: 'PixelRacer', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=demo_game1&backgroundColor=d4a574', vibeTags: ['game', 'fps', 'unhinged'], category: 'gameplay', externalLinks: [], timezone: '', interests: [], interestedInMaking: [], bio: 'Speedrunner & FPS', scraps: 0 },
  { id: 'demo_game2', name: 'RPGValkyrie', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=demo_game2&backgroundColor=d4a574', vibeTags: ['rpg', 'game', 'artistic'], category: 'gameplay', externalLinks: [], timezone: '', interests: [], interestedInMaking: [], bio: 'Story-rich RPGs', scraps: 0 },
  { id: 'demo_music1', name: 'KaraokeKitsune', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=demo_music1&backgroundColor=d4a574', vibeTags: ['sing', 'music', 'wholesome'], category: 'music', externalLinks: [], timezone: '', interests: [], interestedInMaking: [], bio: 'Covers & originals', scraps: 0 },
  { id: 'demo_music2', name: 'GuitarGhost', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=demo_music2&backgroundColor=d4a574', vibeTags: ['music', 'karaoke', 'meme'], category: 'music', externalLinks: [], timezone: '', interests: [], interestedInMaking: [], bio: 'Acoustic ghost tunes', scraps: 0 },
  { id: 'demo_art1', name: 'DoodleDeity', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=demo_art1&backgroundColor=d4a574', vibeTags: ['art', 'creative', 'cozy'], category: 'creative', externalLinks: [], timezone: '', interests: [], interestedInMaking: [], bio: 'Live art + chat', scraps: 0 },
  { id: 'demo_asmr1', name: 'WhisperWillow', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=demo_asmr1&backgroundColor=d4a574', vibeTags: ['asmr', 'chill', 'relax'], category: 'asmr', externalLinks: [], timezone: '', interests: [], interestedInMaking: [], bio: 'Soft ASMR triggers', scraps: 0 },
  { id: 'demo_asmr2', name: 'RaindropASMR', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=demo_asmr2&backgroundColor=d4a574', vibeTags: ['asmr', 'chill', 'cozy'], category: 'asmr', externalLinks: [], timezone: '', interests: [], interestedInMaking: [], bio: 'Rain and fabric sounds', scraps: 0 },
]

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
      let usedSamples = false
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

        if (consts.length > 0 && mapped.length > 0) {
          setVtubers(mapped)
          setConstellations(consts)
        } else {
          // DB returned no usable niche data (common if positions or content_tag matches missing)
          usedSamples = true
        }
      } catch (err) {
        console.error('Niche map error (using demo data):', err)
        usedSamples = true
      }

      if (usedSamples) {
        setVtubers(SAMPLE_VTUBERS)
        setConstellations(SAMPLE_NICHE_CONSTELLATIONS)
        setError(null) // demo data means no error state for the map
      }

      setLoading(false)
    }
    load()
  }, [])

  return { vtubers, constellations, loading, error }
}

export function getVTubersByNicheCluster(vtubers: VTuber[], clusterId: string): VTuber[] {
  return vtubers.filter(v => v.category === clusterId)
}
