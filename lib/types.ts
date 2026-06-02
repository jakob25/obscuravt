// VTVault Core Types - Designed for future Supabase migration

export interface VTuber {
  id: string;
  name: string;
  avatarUrl: string;
  vibeTags: string[];
  category: string; // Constellation cluster
  externalLinks: ExternalLink[];
  timezone: string;
  interests: string[];
  interestedInMaking: string[];
  isWorkerVTuber?: boolean;
  bio?: string;
  scraps: number;
}

export interface ExternalLink {
  platform: 'youtube' | 'twitch' | 'twitter' | 'discord' | 'website';
  url: string;
}

export interface Clip {
  id: string;
  vtuberId: string;
  title: string;
  platform: 'youtube' | 'twitch';
  videoId: string;
  startTime?: number; // seconds
  endTime?: number;
  vibeTags: string[];
  type: 'raw' | 'edited';
  submittedBy: string;
  votes: { up: number; down: number };
  createdAt: string;
}

export interface VibeTag {
  id: string;
  name: string;
  category: 'personality' | 'content' | 'theme';
  color: string;
}

export interface Constellation {
  id: string;
  name: string;
  description: string;
  position: { x: number; y: number };
  color: string;
}

export interface Bet {
  id: string;
  title: string;
  description: string;
  vtuberId?: string;
  options: BetOption[];
  status: 'open' | 'closed' | 'resolved';
  endsAt: string;
  createdAt: string;
}

export interface BetOption {
  id: string;
  label: string;
  odds: number;
  totalScraps: number;
}

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  scraps: number;
  favoriteVTubers: string[];
  savedClips: string[];
}

// ── New feature types ──────────────────────────────────────────────────────

export interface CmdmiIdea {
  id: string
  profile_id: string
  submitted_by: string
  title: string
  description: string
  upvotes: number
  status: 'pending' | 'selected' | 'completed' | 'rejected'
  created_at: string
}

export interface CmdmiGoal {
  id: string
  idea_id: string
  profile_id: string
  set_by: string
  goal_amount: number
  funded_amount: number
  status: 'active' | 'funded' | 'completed'
  created_at: string
  completed_at: string | null
}

export interface FanArt {
  id: string
  vtuber_id: string
  submitted_by: string
  twitter_url: string
  image_url: string | null
  reported: boolean
  created_at: string
}

export interface StreamSchedule {
  id: string
  vtuber_id: string
  day_of_week: number
  start_time: string
  timezone: string
  label: string | null
}

export interface ClusterPost {
  id: string
  constellation_id: string
  username: string
  content: string
  vtuber_id: string | null
  upvotes: number
  created_at: string
}

export interface ClaimedProfile {
  id: string
  username: string
  vtuber_name: string
  display_name: string
  avatar_url: string | null
  banner_url: string | null
  bio: string
  vibe_tags: Record<string, unknown>
  total_endorsements: number
  discoverable: boolean
  claimed_at: string
}

export interface WeeklyDigest {
  topClips: Array<{ id: string; title: string; upvotes: number; vtuber_name: string; clip_url: string }>
  topBet: { id: string; title: string; entries: number } | null
  topVtuber: { id: string; name: string; endorsements: number } | null
  topCmdmi: { goal_amount: number; funded_amount: number; idea_title: string; vtuber_name: string } | null
}
