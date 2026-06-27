/**
 * Multi-claimed VTuber profile model (implementation pending DB migration):
 *
 * - `vtubers.claimed_by` → username that owns the profile
 * - `user_claimed_profiles` (future table): username, vtuber_id, is_active, claimed_at
 * - `users.active_vtuber_id` (future column): which claimed profile is "current"
 *
 * UX: profile switcher in navbar / my-profile when count > 1.
 * Claiming flow: user claims via /api/vtubers/claim → row in user_claimed_profiles + claimed_by set.
 * Session stores username only; active profile resolved server-side from users.active_vtuber_id.
 */

export const MULTI_PROFILE_SCHEMA = {
  table: 'user_claimed_profiles',
  columns: ['username', 'vtuber_id', 'is_active', 'claimed_at'] as const,
  usersColumn: 'active_vtuber_id',
} as const