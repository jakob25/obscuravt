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
  handle?: string;
  scraps: number;
}

export interface ExternalLink {
  platform: 'youtube' | 'twitch' | 'twitter' | 'discord' | 'website';
  url: string;
}
