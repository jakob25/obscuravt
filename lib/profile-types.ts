/** Public user profile fields returned by /api/users/[username] */
export interface UserProfile {
  username: string
  coins: number
  role: string | null
  bio: string
  joined_at: string
  last_bonus: string | null
  total_won: number
  total_lost: number
  biggest_win: number
  biggest_loss: number
  bets_correct: number
  bets_placed: number
  favorite_vtubers: string
  last_seen_version?: string | null
}