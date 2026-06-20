// VTVault Core Types

export interface ExternalLink {
  platform: 'youtube' | 'twitch' | 'twitter' | 'discord' | 'website';
  url: string;
}

export interface VTuber {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  bio?: string;
  category?: string;
  vibeTags?: string[];
  externalLinks?: ExternalLink[];
  timezone?: string;
  interests?: string[];
  interestedInMaking?: string[];
  isWorkerVTuber?: boolean;
  scraps?: number;
  approved?: boolean;
  platform?: string;
  link?: string;
}

export interface Constellation {
  id: string;
  name: string;
  description?: string;
  position: { x: number; y: number };
  color: string;
}

export interface VibeTag {
  id: string;
  name: string;
  category: 'personality' | 'content' | 'theme';
  color: string;
}

export interface Clip {
  id: string;
  vtuberId: string;
  title: string;
  platform: string;
  videoId: string;
  vibeTags?: string[];
  type?: string;
  submittedBy?: string;
  votes?: { up: number; down: number };
  createdAt?: string;
}

export interface BetOption {
  id: string | number;
  label: string;
  odds?: number;
  totalScraps: number;
}

export interface Bet {
  id: string;
  title: string;
  description?: string;
  vtuberId?: string;
  options: BetOption[];
  status: 'open' | 'closed' | string;
  endsAt?: string;
  createdAt?: string;
}

export interface DbBet {
  id: string;
  title: string;
  description?: string;
  options: string[];
  status: string;
  created_at: string;
}

export interface DbBetEntry {
  option: string;
  amount: number;
}
