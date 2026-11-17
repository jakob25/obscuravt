/**
 * Find My Oshi quiz questions — shared by the quiz page and its page metadata/share
 * card, so the question count shown anywhere is always the real one.
 */
// Quiz questions are editorial — the tag IDs in options are matched against
// whatever tags VTubers have in Supabase. Unknown/removed tag IDs simply score 0.
// To add a new question: add to QUESTIONS array with tag IDs from canonical_tags.
// To add a new answer option: include the relevant clust_*, vibe_*, or cont_* tag IDs.
export interface Question {
  id: string
  text: string
  options: { label: string; symbol: string; tags: string[] }[]
}

export const QUESTIONS: Question[] = [
  {
    id: 'energy',
    text: 'What kind of stream energy do you vibe with most?',
    options: [
      { label: 'Chaotic and unpredictable', symbol: '✦', tags: ['clust_chaos', 'vibe_chaotic', 'vibe_gremlin'] },
      { label: 'Chill and cozy', symbol: '◇', tags: ['clust_comfy', 'vibe_comfy', 'vibe_chill'] },
      { label: 'High energy hype', symbol: '▲', tags: ['clust_variety', 'vibe_hype'] },
      { label: 'Deep lore and emotional', symbol: '◐', tags: ['clust_menhara', 'vibe_menhara', 'vibe_lore'] },
    ],
  },
  {
    id: 'content',
    text: 'What content do you watch most?',
    options: [
      { label: 'Gaming', symbol: '◈', tags: ['cont_gaming', 'cont_rpg', 'clust_gaming'] },
      { label: 'Just chatting / zatsudans', symbol: '◎', tags: ['vibe_zatsudan', 'cont_chatting', 'clust_variety'] },
      { label: 'Music and karaoke', symbol: '♪', tags: ['clust_vsinger', 'cont_karaoke', 'vibe_original_music'] },
      { label: 'Art streams', symbol: '◆', tags: ['cont_drawing', 'clust_creative'] },
    ],
  },
  {
    id: 'vibe',
    text: 'What draws you to a VTuber?',
    options: [
      { label: 'They feel like a genuine friend', symbol: '♦', tags: ['vibe_comfy', 'vibe_wholesome', 'clust_comfy'] },
      { label: 'Unhinged and unpredictable', symbol: '↻', tags: ['vibe_gremlin', 'vibe_chaotic', 'clust_chaos'] },
      { label: 'Unique and niche taste', symbol: '⊕', tags: ['clust_denpa', 'vibe_denpa', 'clust_experimental'] },
      { label: 'Deep lore and worldbuilding', symbol: '⊞', tags: ['vibe_lore', 'clust_menhara', 'vibe_chuuni'] },
    ],
  },
  {
    id: 'aesthetic',
    text: 'Pick a vibe:',
    options: [
      { label: 'Dark, glitchy, internet-poisoned', symbol: '†', tags: ['clust_denpa', 'vibe_denpa', 'cont_horror'] },
      { label: 'Warm, soft, cottagecore', symbol: '○', tags: ['clust_comfy', 'vibe_comfy', 'vibe_asmr'] },
      { label: 'Loud, loud, LOUDER', symbol: '!!', tags: ['clust_chaos', 'vibe_hype', 'vibe_gremlin'] },
      { label: 'Creative and expressive', symbol: '✧', tags: ['clust_vsinger', 'cont_drawing', 'clust_creative'] },
    ],
  },
  {
    id: 'stream_time',
    text: 'When do you usually watch streams?',
    options: [
      { label: 'Late night, can\'t sleep', symbol: '◐', tags: ['vibe_chill', 'vibe_asmr', 'clust_comfy'] },
      { label: 'Background noise while working', symbol: '▤', tags: ['vibe_zatsudan', 'vibe_comfy'] },
      { label: 'All day, I\'m a menace', symbol: '▲', tags: ['vibe_chaotic', 'vibe_hype', 'clust_chaos'] },
      { label: 'Specifically for events and premieres', symbol: '★', tags: ['clust_vsinger', 'vibe_hype'] },
    ],
  },
]


/** Encode chosen option indexes for a shareable result link, e.g. "0,1,3,2,0". */
export function encodeOshiAnswers(indexes: number[]): string {
  return indexes.join(',')
}

/** Decode ?a= back to per-question tag lists; null unless every question has a valid answer. */
export function decodeOshiAnswers(raw: string | null | undefined): { indexes: number[]; tags: string[][] } | null {
  if (!raw) return null
  const parts = raw.split(',').map(p => p.trim())
  if (parts.length !== QUESTIONS.length) return null
  const indexes: number[] = []
  const tags: string[][] = []
  for (let i = 0; i < parts.length; i++) {
    if (!/^\d+$/.test(parts[i])) return null
    const n = Number(parts[i])
    const opt = QUESTIONS[i].options[n]
    if (!opt) return null
    indexes.push(n)
    tags.push(opt.tags)
  }
  return { indexes, tags }
}
