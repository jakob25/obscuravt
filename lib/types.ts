// VTVault Core Types - Centralized type definitions

// Basic link type
export interface ExternalLink {
  platform: 'youtube' | 'twitch' | 'twitter' | 'discord' | 'website';
  url: string;
}

// Main VTuber type (used across the app)
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

// Constellation for star/niche maps
export interface Constellation {
  id: string;
  name: string;
  description?: string;
  position: { x: number; y: number };
  color: string;
}

// Vibe tag with strict category
export interface VibeTag {
  id: string;
  name: string;
  category: 'personality' | 'content' | 'theme';
  color: string;
}

// Clip type
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

// Bet option (used in betting system)
export interface BetOption {
  id: string | number;
  label: string;
  odds?: number;
  totalScraps: number;
}

// Bet type
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

// Database-level bet (raw from Supabase)
export interface DbBet {
  id: string;
  title: string;
  description?: string;
  options: string[];
  status: string;
  created_at: string;
}

// Database-level bet entry
export interface DbBetEntry {
  option: string;
  amount: number;
}

// Niche cluster (used in niche map)
export interface NicheCluster {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
}
