// VTVault Core Types

export interface ExternalLink {
  platform: 'youtube' | 'twitch' | 'twitter' | 'discord' | 'website';
  url: string;
}

export interface VTuber {
  id: string;
  name: string;
  avatarUrl: string;
  vibeTags: string[];
  category: string;
  externalLinks: ExternalLink[];
  timezone: string;
  interests: string[];
  interestedInMaking: string[];
  isWorkerVTuber?: boolean;
  bio?: string;
  handle?: string;
  scraps: number;
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
  category: string;
  color: string;
}

export interface Clip {
  id: string;
  vtuberId: string;
  title: string;
  platform: string;
  videoId: string;
  vibeTags: string[];
  type: string;
  submittedBy: string;
  votes: { up: number; down: number };
  createdAt: string;
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
  status: 'open' | 'closed';
  endsAt?: string;
  createdAt?: string;
}
