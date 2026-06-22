/** Bump when shipping user-facing updates; triggers the announcement modal once per user. */
export const APP_VERSION = '2026.06.21'

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
}