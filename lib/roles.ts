import type { WidgetId } from '@/components/common/dashboard-customizer'

/** Canonical onboarding roles */
export const ROLES = ['VTuber', 'Creator', 'Fan'] as const
export type AppRole = typeof ROLES[number]

/** Maps legacy DB values to current roles */
const LEGACY_MAP: Record<string, AppRole> = {
  Viewer: 'Fan',
  Streamer: 'VTuber',
  Clipper: 'Creator',
  user: 'Fan',
}

export function normalizeRole(role: string | null | undefined): AppRole | null {
  if (!role) return null
  if ((ROLES as readonly string[]).includes(role)) return role as AppRole
  return LEGACY_MAP[role] ?? null
}

export function isValidRole(role: string): role is AppRole {
  return (ROLES as readonly string[]).includes(role)
}

/** Default dashboard widgets per role */
export const ROLE_DEFAULT_WIDGETS: Record<AppRole, WidgetId[]> = {
  Fan: ['your_circle', 'daily_loop', 'active_bets', 'my_clips'],
  Creator: ['your_circle', 'daily_loop', 'my_clips', 'trending_clips', 'tag_validator', 'active_bets'],
  VTuber: ['daily_loop', 'recent_notifications', 'your_circle', 'active_bets', 'leaderboard', 'tag_validator'],
}

/** Widgets a role is allowed to add in the customizer */
export const ROLE_ALLOWED_WIDGETS: Record<AppRole, WidgetId[]> = {
  Fan: ['your_circle', 'daily_loop', 'my_clips', 'trending_clips', 'find_my_oshi', 'forums', 'active_bets', 'weekly_digest', 'leaderboard', 'recent_notifications', 'constellations', 'featured_vtubers'],
  Creator: ['your_circle', 'daily_loop', 'my_clips', 'trending_clips', 'tag_validator', 'leaderboard', 'active_bets', 'forums', 'weekly_digest', 'recent_notifications', 'constellations', 'featured_vtubers', 'find_my_oshi'],
  VTuber: ['your_circle', 'daily_loop', 'recent_notifications', 'active_bets', 'leaderboard', 'tag_validator', 'featured_vtubers', 'trending_clips', 'forums', 'weekly_digest', 'constellations', 'find_my_oshi', 'my_clips'],
}

export const ROLE_LABELS: Record<AppRole, string> = {
  VTuber: 'VTuber — manage your claimed profile, streams, and fan engagement',
  Creator: 'Creator — clip, curate, and grow the community',
  Fan: 'Fan — discover oshis, save clips, and join the conversation',
}