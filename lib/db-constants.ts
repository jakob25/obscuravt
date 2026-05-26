// Ported from database.py — all game constants live here

export const STARTING_COINS = 5_000
export const DAILY_BONUS = 250
export const HOUSE_CUT = 0.05
export const MIN_VOTES = 3
export const FALLBACK_DAYS = 6

export const CATEGORIES = [
  'Hidden Gem',
  'Boss Fight',
  'Death Count',
  'Game Completion',
  'Yap Session / Just Chatting',
  'Tech Scuff',
  'Karaoke Arc',
  'Follower / Sub Goal',
  'Raid / Shoutout',
  'Chaos Moment',
  'Other',
] as const

export type BetCategory = typeof CATEGORIES[number]

export const ROLES = ['Viewer', 'Streamer', 'Clipper'] as const
export type UserRole = typeof ROLES[number]

export const BADGE_STYLES: Record<string, string> = {
  gem_hunter: 'badge-gem',
  high_roller: 'badge-roller',
  first_vote: 'badge-vote',
  indie_scout: 'badge-scout',
  raid_master: 'badge-raid',
  clipper_legend: 'badge-scout',
}

// Supabase row types
export interface DbUser {
  username: string
  password_hash: string
  coins: number
  joined_at: string
  last_bonus: string | null
  total_won: number
  total_lost: number
  biggest_win: number
  biggest_loss: number
  bets_correct: number
  bets_placed: number
  deciding_votes: number
  role: UserRole | null
  bio: string
  favorite_vtubers: string
}

export interface DbBet {
  id: string
  vtuber_name: string
  stream_link: string
  game_or_activity: string
  title: string
  description: string
  options: string[]
  status: 'open' | 'voting' | 'closed'
  created_at: string
  created_by: string
  category: BetCategory
  result: string | null
}

export interface DbBetEntry {
  id: string
  bet_id: string
  username: string
  option: string
  amount: number
  created_at: string
}

export interface DbVote {
  id: string
  bet_id: string
  username: string
  option: string
  created_at: string
}

export interface DbAchievement {
  id: string
  name: string
  description: string
  reward_coins: number
  icon: string
}

export interface DbUserBadge {
  id: string
  username: string
  achievement_id: string
  earned_at: string
}

export interface DbShopItem {
  id: string
  name: string
  description: string
  type: string
  cost: number
  preview_url: string | null
}

export interface DbUserCosmetic {
  id: string
  username: string
  item_id: string
  equipped: boolean
  purchased_at: string
}

export interface DbClip {
  id: string
  profile_id: string
  username: string
  title: string
  url: string
  thumbnail_url: string | null
  duration: number | null
  views: number
  created_at: string
}

export interface DbVTuberProfile {
  id: string
  name: string
  avatar_url: string | null
  bio: string | null
  vibe_tags: string[]
  category: string
  timezone: string
  interests: string[]
  interested_in_making: string[]
  is_worker_vtuber: boolean
  scraps: number
  external_links: Array<{ platform: string; url: string }>
  submitted_by: string
  created_at: string
}
