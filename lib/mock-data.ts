import type { VTuber, Clip, VibeTag, Constellation, Bet } from './types';

// Vibe Tags - the heart of the discovery system
export const vibeTags: VibeTag[] = [
  // Personality tags
  { id: 'gremlin', name: 'Gremlin Energy', category: 'personality', color: '#cc6b3d' },
  { id: 'comfy', name: 'Comfy Vibes', category: 'personality', color: '#8b7355' },
  { id: 'unhinged', name: 'Unhinged', category: 'personality', color: '#b8860b' },
  { id: 'wholesome', name: 'Wholesome', category: 'personality', color: '#c9a227' },
  { id: 'chaotic', name: 'Chaotic Neutral', category: 'personality', color: '#cc6b3d' },
  { id: 'chill', name: 'Chill Stream', category: 'personality', color: '#6b8e8b' },
  { id: 'hype', name: 'High Energy', category: 'personality', color: '#d4a574' },
  
  // Content tags
  { id: 'zatsudan', name: 'Zatsudan King/Queen', category: 'content', color: '#d4a574' },
  { id: 'retro', name: 'Retro Gaming', category: 'content', color: '#8b7355' },
  { id: 'horror', name: 'Horror Enjoyer', category: 'content', color: '#4a4a4a' },
  { id: 'karaoke', name: 'Karaoke Regular', category: 'content', color: '#c9a227' },
  { id: 'art', name: 'Art Streams', category: 'content', color: '#b8860b' },
  { id: 'asmr', name: 'ASMR', category: 'content', color: '#6b8e8b' },
  { id: 'fps', name: 'FPS Gamer', category: 'content', color: '#cc6b3d' },
  { id: 'rpg', name: 'RPG Enthusiast', category: 'content', color: '#8b7355' },
  
  // Theme tags
  { id: 'stem', name: 'STEM', category: 'theme', color: '#4a7c6f' },
  { id: 'weather', name: 'Meteorology/Weather', category: 'theme', color: '#6b8e8b' },
  { id: 'medicine', name: 'Medicine', category: 'theme', color: '#cc6b3d' },
  { id: 'history', name: 'History Nerd', category: 'theme', color: '#8b7355' },
  { id: 'lore', name: 'Deep Lore', category: 'theme', color: '#b8860b' },
  { id: 'cooking', name: 'Cooking/Food', category: 'theme', color: '#d4a574' },
  { id: 'talkshow', name: 'Talk Show Host', category: 'theme', color: '#c9a227' },
];

// Constellations - the category clusters for the star map
export const constellations: Constellation[] = [
  { id: 'chaotic', name: 'Chaotic Energy', description: 'Unhinged, gremlin, high-energy streamers', position: { x: 200, y: 150 }, color: '#cc6b3d' },
  { id: 'cozy', name: 'Cozy Corner', description: 'Comfy, wholesome, chill vibes', position: { x: 600, y: 200 }, color: '#8b7355' },
  { id: 'creative', name: 'Creative Cosmos', description: 'Art, music, and creative streams', position: { x: 400, y: 450 }, color: '#c9a227' },
  { id: 'gaming', name: 'Gaming Galaxy', description: 'All things gaming - retro to modern', position: { x: 750, y: 400 }, color: '#4a7c6f' },
  { id: 'knowledge', name: 'Knowledge Nebula', description: 'STEM, history, educational content', position: { x: 150, y: 400 }, color: '#6b8e8b' },
  { id: 'social', name: 'Social Stars', description: 'Zatsudan, talk shows, community streams', position: { x: 500, y: 100 }, color: '#d4a574' },
];

// Mock VTubers
export const vtubers: VTuber[] = [
  {
    id: 'luna-hex',
    name: 'Luna Hex',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=luna&backgroundColor=d4a574',
    vibeTags: ['gremlin', 'unhinged', 'retro', 'zatsudan'],
    category: 'chaotic',
    externalLinks: [
      { platform: 'youtube', url: 'https://youtube.com/@example' },
      { platform: 'twitch', url: 'https://twitch.tv/example' },
      { platform: 'twitter', url: 'https://twitter.com/example' },
    ],
    timezone: 'EST',
    interests: ['Retro games', 'Horror movies', 'Chaos'],
    interestedInMaking: ['Horror game playthroughs', 'Cooking streams'],
    bio: 'Professional chaos agent and retro game enthusiast. I will scream at old games for your entertainment.',
    scraps: 15420,
  },
  {
    id: 'dr-stellar',
    name: 'Dr. Stellar',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=stellar&backgroundColor=6b8e8b',
    vibeTags: ['stem', 'comfy', 'chill', 'weather'],
    category: 'knowledge',
    externalLinks: [
      { platform: 'youtube', url: 'https://youtube.com/@example2' },
      { platform: 'twitter', url: 'https://twitter.com/example2' },
    ],
    timezone: 'PST',
    interests: ['Astrophysics', 'Weather patterns', 'Science communication'],
    interestedInMaking: ['Podcast-style discussions', 'Collab debates'],
    isWorkerVTuber: true,
    bio: 'Actual meteorologist by day, VTuber by night. Let me explain why that cloud looks suspicious.',
    scraps: 8750,
  },
  {
    id: 'mochi-dreams',
    name: 'Mochi Dreams',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=mochi&backgroundColor=c9a227',
    vibeTags: ['wholesome', 'art', 'comfy', 'karaoke'],
    category: 'creative',
    externalLinks: [
      { platform: 'youtube', url: 'https://youtube.com/@example3' },
      { platform: 'twitch', url: 'https://twitch.tv/example3' },
    ],
    timezone: 'JST',
    interests: ['Digital art', 'J-pop', 'Cozy games'],
    interestedInMaking: ['ASMR streams', 'Art tutorials'],
    bio: 'Drawing cute things and singing off-key. Maximum comfy energy only.',
    scraps: 22100,
  },
  {
    id: 'void-knight',
    name: 'Void Knight',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=void&backgroundColor=4a4a4a',
    vibeTags: ['horror', 'lore', 'rpg', 'chill'],
    category: 'gaming',
    externalLinks: [
      { platform: 'twitch', url: 'https://twitch.tv/example4' },
      { platform: 'discord', url: 'https://discord.gg/example' },
    ],
    timezone: 'GMT',
    interests: ['Soulslike games', 'Cosmic horror', 'Worldbuilding'],
    interestedInMaking: ['TTRPG streams', 'Lore deep-dives'],
    bio: 'I have died 847 times in Elden Ring. The void stares back, and I wave.',
    scraps: 12300,
  },
  {
    id: 'captain-bytes',
    name: 'Captain Bytes',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=bytes&backgroundColor=4a7c6f',
    vibeTags: ['stem', 'chaotic', 'hype', 'talkshow'],
    category: 'knowledge',
    externalLinks: [
      { platform: 'youtube', url: 'https://youtube.com/@example5' },
      { platform: 'twitter', url: 'https://twitter.com/example5' },
    ],
    timezone: 'CET',
    interests: ['Programming', 'Tech news', 'Speedrunning'],
    interestedInMaking: ['Coding streams', 'Tech reviews'],
    isWorkerVTuber: true,
    bio: 'Software dev who explains code while gaming. Yes, I can fix your printer. No, I will not.',
    scraps: 9800,
  },
  {
    id: 'sakura-rain',
    name: 'Sakura Rain',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=sakura&backgroundColor=d4a574',
    vibeTags: ['asmr', 'comfy', 'wholesome', 'cooking'],
    category: 'cozy',
    externalLinks: [
      { platform: 'youtube', url: 'https://youtube.com/@example6' },
      { platform: 'twitch', url: 'https://twitch.tv/example6' },
    ],
    timezone: 'JST',
    interests: ['Cooking', 'Tea ceremony', 'Relaxation'],
    interestedInMaking: ['Cooking ASMR', 'Garden streams'],
    bio: 'Whispering recipes and making tea. Your daily dose of tranquility.',
    scraps: 18500,
  },
  {
    id: 'neon-rebel',
    name: 'Neon Rebel',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=neon&backgroundColor=cc6b3d',
    vibeTags: ['fps', 'hype', 'chaotic', 'unhinged'],
    category: 'gaming',
    externalLinks: [
      { platform: 'twitch', url: 'https://twitch.tv/example7' },
      { platform: 'twitter', url: 'https://twitter.com/example7' },
    ],
    timezone: 'PST',
    interests: ['Competitive FPS', 'Esports', 'Trash talk'],
    interestedInMaking: ['Tournament commentary', 'Coaching streams'],
    bio: 'I will 360 no-scope your feelings. Competitive gamer with zero chill.',
    scraps: 31200,
  },
  {
    id: 'chronicle-sage',
    name: 'Chronicle Sage',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=chronicle&backgroundColor=8b7355',
    vibeTags: ['history', 'lore', 'zatsudan', 'talkshow'],
    category: 'social',
    externalLinks: [
      { platform: 'youtube', url: 'https://youtube.com/@example8' },
    ],
    timezone: 'EST',
    interests: ['Ancient history', 'Mythology', 'Storytelling'],
    interestedInMaking: ['History documentaries', 'Mythology explainers'],
    bio: 'Your friendly neighborhood history nerd. Did you know the Romans...',
    scraps: 14700,
  },
];

// Mock Clips
export const clips: Clip[] = [
  {
    id: 'clip-1',
    vtuberId: 'luna-hex',
    title: 'Luna discovers the final boss has a SECOND phase',
    platform: 'youtube',
    videoId: 'dQw4w9WgXcQ',
    startTime: 120,
    endTime: 180,
    vibeTags: ['gremlin', 'unhinged'],
    type: 'raw',
    submittedBy: 'fan_user_1',
    votes: { up: 342, down: 12 },
    createdAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'clip-2',
    vtuberId: 'dr-stellar',
    title: 'Dr. Stellar explains why that cloud is actually terrifying',
    platform: 'youtube',
    videoId: 'dQw4w9WgXcQ',
    startTime: 300,
    endTime: 420,
    vibeTags: ['stem', 'weather'],
    type: 'raw',
    submittedBy: 'fan_user_2',
    votes: { up: 891, down: 23 },
    createdAt: '2024-01-14T09:15:00Z',
  },
  {
    id: 'clip-3',
    vtuberId: 'mochi-dreams',
    title: 'Mochi sings her heart out at 3AM',
    platform: 'twitch',
    videoId: 'example_clip_id',
    vibeTags: ['karaoke', 'wholesome'],
    type: 'raw',
    submittedBy: 'fan_user_3',
    votes: { up: 1205, down: 8 },
    createdAt: '2024-01-13T03:45:00Z',
  },
  {
    id: 'clip-4',
    vtuberId: 'void-knight',
    title: 'Death #847 - The Void Knight saga continues',
    platform: 'youtube',
    videoId: 'dQw4w9WgXcQ',
    startTime: 45,
    endTime: 90,
    vibeTags: ['horror', 'rpg'],
    type: 'edited',
    submittedBy: 'fan_user_4',
    votes: { up: 567, down: 34 },
    createdAt: '2024-01-12T18:20:00Z',
  },
  {
    id: 'clip-5',
    vtuberId: 'neon-rebel',
    title: 'The clutch that broke chat',
    platform: 'twitch',
    videoId: 'example_clip_id_2',
    vibeTags: ['fps', 'hype'],
    type: 'raw',
    submittedBy: 'fan_user_5',
    votes: { up: 2341, down: 156 },
    createdAt: '2024-01-11T22:00:00Z',
  },
  {
    id: 'clip-6',
    vtuberId: 'chronicle-sage',
    title: 'When the Sage goes on a 20-minute tangent about Roman bread',
    platform: 'youtube',
    videoId: 'dQw4w9WgXcQ',
    startTime: 600,
    endTime: 1800,
    vibeTags: ['history', 'zatsudan'],
    type: 'raw',
    submittedBy: 'fan_user_6',
    votes: { up: 445, down: 18 },
    createdAt: '2024-01-10T16:30:00Z',
  },
];

// Mock Bets for VTuberBets feature
export const bets: Bet[] = [
  {
    id: 'bet-1',
    title: 'Will Luna beat the final boss tonight?',
    description: 'Luna has been stuck on this boss for 3 streams. Place your bets!',
    vtuberId: 'luna-hex',
    options: [
      { id: 'opt-1a', label: 'Yes, she finally wins!', odds: 2.5, totalScraps: 4500 },
      { id: 'opt-1b', label: 'No, rage quit incoming', odds: 1.8, totalScraps: 6200 },
      { id: 'opt-1c', label: 'Glitches through the floor', odds: 8.0, totalScraps: 800 },
    ],
    status: 'open',
    endsAt: '2024-01-20T02:00:00Z',
    createdAt: '2024-01-18T14:00:00Z',
  },
  {
    id: 'bet-2',
    title: 'Mochi karaoke song count prediction',
    description: 'How many songs will Mochi sing in her weekend karaoke stream?',
    vtuberId: 'mochi-dreams',
    options: [
      { id: 'opt-2a', label: 'Under 15 songs', odds: 3.2, totalScraps: 2100 },
      { id: 'opt-2b', label: '15-25 songs', odds: 1.6, totalScraps: 8400 },
      { id: 'opt-2c', label: 'Over 25 songs', odds: 2.8, totalScraps: 3200 },
    ],
    status: 'open',
    endsAt: '2024-01-21T12:00:00Z',
    createdAt: '2024-01-17T10:00:00Z',
  },
  {
    id: 'bet-3',
    title: 'Neon Rebel tournament placement',
    description: 'Where will Neon Rebel place in the upcoming Valorant tournament?',
    vtuberId: 'neon-rebel',
    options: [
      { id: 'opt-3a', label: '1st Place', odds: 4.0, totalScraps: 5600 },
      { id: 'opt-3b', label: 'Top 4', odds: 1.4, totalScraps: 12000 },
      { id: 'opt-3c', label: 'Eliminated early', odds: 6.5, totalScraps: 1800 },
    ],
    status: 'open',
    endsAt: '2024-01-22T18:00:00Z',
    createdAt: '2024-01-16T08:00:00Z',
  },
];

// Helper functions
export function getVTuberById(id: string): VTuber | undefined {
  return vtubers.find(v => v.id === id);
}

export function getClipsByVTuber(vtuberId: string): Clip[] {
  return clips.filter(c => c.vtuberId === vtuberId);
}

export function getVTubersByConstellation(constellationId: string): VTuber[] {
  return vtubers.filter(v => v.category === constellationId);
}

export function getVibeTagByIds(ids: string[]): VibeTag[] {
  return vibeTags.filter(t => ids.includes(t.id));
}

export function searchVTubersByTags(tagIds: string[]): VTuber[] {
  if (tagIds.length === 0) return vtubers;
  return vtubers.filter(v => 
    tagIds.some(tag => v.vibeTags.includes(tag))
  );
}

export function filterClips(options: {
  type?: 'raw' | 'edited';
  vtuberId?: string;
  tags?: string[];
}): Clip[] {
  let result = [...clips];
  
  if (options.type) {
    result = result.filter(c => c.type === options.type);
  }
  if (options.vtuberId) {
    result = result.filter(c => c.vtuberId === options.vtuberId);
  }
  if (options.tags && options.tags.length > 0) {
    result = result.filter(c => 
      options.tags!.some(tag => c.vibeTags.includes(tag))
    );
  }
  
  return result;
}
