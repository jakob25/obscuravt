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
