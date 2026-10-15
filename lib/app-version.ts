import generated from './generated-updates.json'

/** Bump when shipping user-facing updates; triggers the announcement modal once per user. */
const HANDWRITTEN_APP_VERSION = '2026.06.23'

export const UPDATE_ANNOUNCEMENTS: Record<string, { title: string; body: string[] }> = {
  '2026.06.21': {
    title: 'Vault Update — Roles, Clip Stats & More',
    body: [
      'Choose your role: VTuber, Creator, or Fan — your dashboard adapts to you.',
      'Fans can now track clip metrics for everything they submit.',
      'Profile, leaderboard, and notifications are live. Sessions end when you close the browser.',
      'Forums, Chat Made Me Do It, fan art, and stream resources are rolling out on staging.',
    ],
  },
  '2026.06.23': {
    title: 'Vault Update — Engagement & Discovery',
    body: [
      'Tag Validator and Nominator are live — earn scraps validating tags, nominate creators for the Star Map.',
      'Memes now have shareable links at /meme/[slug]. Upload images directly for memes and fan art.',
      'Resources expanded with Stream Setup tools and a Debut Checklist.',
      'Corpo collectives, weekly digest widget, and fan engagement tabs (Q&A, karaoke, schedule votes) are ready.',
    ],
  },
}

const gen = generated as { version: string | null; title: string | null; body: string[] }
const hasGenerated = !!gen.version && Array.isArray(gen.body) && gen.body.length > 0

if (hasGenerated && gen.version && !UPDATE_ANNOUNCEMENTS[gen.version]) {
  UPDATE_ANNOUNCEMENTS[gen.version] = { title: gen.title || "What's New on the Vault", body: gen.body }
}

/** Newest generated Update: version when present, otherwise the hand-written value. */
export const APP_VERSION = hasGenerated && gen.version ? gen.version : HANDWRITTEN_APP_VERSION
