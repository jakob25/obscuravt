-- VTVault Supabase Schema
-- Run this in the Supabase SQL editor to set up your database

-- Users
create table if not exists users (
  username text primary key,
  password_hash text not null,
  coins integer not null default 5000,
  joined_at timestamptz not null default now(),
  last_bonus timestamptz,
  total_won integer not null default 0,
  total_lost integer not null default 0,
  biggest_win integer not null default 0,
  biggest_loss integer not null default 0,
  bets_correct integer not null default 0,
  bets_placed integer not null default 0,
  deciding_votes integer not null default 0,
  role text,
  bio text not null default '',
  favorite_vtubers text not null default ''
);

-- VTuber profiles (community-submitted)
create table if not exists vtuber_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_url text,
  bio text,
  vibe_tags text[] not null default '{}',
  category text not null default 'Other',
  timezone text not null default 'UTC',
  interests text[] not null default '{}',
  interested_in_making text[] not null default '{}',
  is_worker_vtuber boolean not null default false,
  scraps integer not null default 0,
  external_links jsonb not null default '[]',
  submitted_by text not null references users(username),
  created_at timestamptz not null default now()
);

-- Bets
create table if not exists bets (
  id uuid primary key default gen_random_uuid(),
  vtuber_name text not null,
  stream_link text not null default '',
  game_or_activity text not null default '',
  title text not null,
  description text not null default '',
  options text[] not null,
  status text not null default 'open' check (status in ('open','voting','closed')),
  created_by text not null references users(username),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- Bet options tracking (scraps staked per option)
create table if not exists bet_options (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id) on delete cascade,
  option_text text not null,
  total_scraps integer not null default 0
);

-- User bets (who bet what)
create table if not exists user_bets (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id) on delete cascade,
  user_username text not null references users(username),
  option_index integer not null,
  amount integer not null,
  created_at timestamptz not null default now()
);

-- Clips
create table if not exists clips (
  id uuid primary key default gen_random_uuid(),
  vtuber_name text not null,
  platform text not null check (platform in ('youtube','twitch','other')),
  url text not null,
  title text not null,
  thumbnail text,
  votes_up integer not null default 0,
  votes_down integer not null default 0,
  submitted_by text not null references users(username),
  created_at timestamptz not null default now()
);

-- Clip votes
create table if not exists clip_votes (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references clips(id) on delete cascade,
  user_username text not null references users(username),
  vote_type text not null check (vote_type in ('up','down')),
  created_at timestamptz not null default now(),
  unique(clip_id, user_username)
);

-- CMDMI (Could Make Do More Ideas)
create table if not exists cmdmi (
  id uuid primary key default gen_random_uuid(),
  vtuber_name text not null,
  idea text not null,
  pledges integer not null default 0,
  submitted_by text not null references users(username),
  created_at timestamptz not null default now()
);

-- CMDMI pledges
create table if not exists cmdmi_pledges (
  id uuid primary key default gen_random_uuid(),
  cmdmi_id uuid not null references cmdmi(id) on delete cascade,
  user_username text not null references users(username),
  amount integer not null,
  created_at timestamptz not null default now()
);

-- Fan art / photos
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  vtuber_name text not null,
  url text not null,
  platform text,
  title text,
  submitted_by text not null references users(username),
  created_at timestamptz not null default now()
);

-- Schedules
create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  vtuber_name text not null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  platform text,
  link text,
  submitted_by text not null references users(username),
  created_at timestamptz not null default now()
);

-- Forums posts
create table if not exists forum_posts (
  id uuid primary key default gen_random_uuid(),
  constellation text not null,
  author text not null references users(username),
  content text not null,
  votes integer not null default 0,
  created_at timestamptz not null default now()
);

-- Forum votes
create table if not exists forum_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references forum_posts(id) on delete cascade,
  user_username text not null references users(username),
  created_at timestamptz not null default now(),
  unique(post_id, user_username)
);

-- Shop / cosmetics
create table if not exists cosmetic_items (
  id text primary key,
  name text not null,
  type text not null check (type in ('badge','theme','emote')),
  cost integer not null,
  description text
);

create table if not exists user_cosmetics (
  user_username text not null references users(username),
  item_id text not null references cosmetic_items(id),
  equipped boolean not null default false,
  purchased_at timestamptz not null default now(),
  primary key (user_username, item_id)
);

-- Achievements
create table if not exists achievements (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  condition text not null
);

create table if not exists user_achievements (
  user_username text not null references users(username),
  achievement_id text not null references achievements(id),
  unlocked_at timestamptz not null default now(),
  primary key (user_username, achievement_id)
);

-- Canonical tags (vibes, niches, content)
create table if not exists canonical_tags (
  id text primary key,
  category text not null check (category in ('vibe','niche_cluster','content','constellation')),
  name text not null,
  color text,
  description text,
  position_x real,
  position_y real,
  content_tag_ids text[] default '{}'
);

-- Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_username text not null references users(username),
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Seed data: achievements
insert into achievements (id, name, description, icon, condition) values
('first_bet', 'First Bet', 'Place your first bet', '🎲', 'bets_placed >= 1'),
('big_win', 'Big Win', 'Win 1000+ scraps on a single bet', '🏆', 'biggest_win >= 1000'),
('veteran', 'Veteran Bettor', 'Place 50 bets', '💪', 'bets_placed >= 50'),
('accurate', 'Oracle', 'Get 10 bets correct', '🔮', 'bets_correct >= 10'),
('clip_curator', 'Clip Curator', 'Submit 10 clips', '🎬', 'submitted_clips >= 10'),
('tag_master', 'Tag Master', 'Validate 50 tags', '⚡', 'validated_tags >= 50')
on conflict (id) do nothing;

-- Seed some cosmetic items
insert into cosmetic_items (id, name, type, cost, description) values
('gold_badge', 'Gold Badge', 'badge', 500, 'Shimmering gold badge next to your name'),
('cosmic_theme', 'Cosmic Theme', 'theme', 1200, 'Deep space dark theme with star accents'),
('heart_emote', 'Heart Emote', 'emote', 300, 'Use :heart: in forums')
on conflict (id) do nothing;

-- Seed canonical vibe constellations (for star map)
insert into canonical_tags (id, category, name, color, description, position_x, position_y) values
('energetic', 'constellation', 'Energetic', '#f59e0b', 'High energy, chaotic good, loud and proud', -0.8, -0.6),
('chill', 'constellation', 'Chill', '#10b981', 'Relaxed, lowkey, cozy vibes', 0.7, 0.5),
('meme', 'constellation', 'Meme Lord', '#8b5cf6', 'Chaos gremlin, shitposter supreme', 0.2, -0.9),
('artistic', 'constellation', 'Artistic', '#ec4899', 'Creative soul, aesthetic first', -0.5, 0.8),
('gamer', 'constellation', 'Gamer', '#3b82f6', 'FPS, strategy, speedrunner', 0.9, -0.3)
on conflict (id) do nothing;

-- Seed some vibe tags
insert into canonical_tags (id, category, name, color) values
('hyper', 'vibe', 'Hyper', '#f43f5e'),
('wholesome', 'vibe', 'Wholesome', '#34d399'),
('unhinged', 'vibe', 'Unhinged', '#a855f7'),
('cozy', 'vibe', 'Cozy', '#fbbf24')
on conflict (id) do nothing;

-- Seed niche clusters
insert into canonical_tags (id, category, name, color, description, content_tag_ids) values
('just_chatting', 'niche_cluster', 'Just Chatting', '#eab308', 'IRL, zatsudan, talking streams', ARRAY['talk','irl','chat']),
('gameplay', 'niche_cluster', 'Gameplay', '#22c55e', 'Specific games or variety gaming', ARRAY['game','fps','rpg']),
('music', 'niche_cluster', 'Music & Karaoke', '#a78bfa', 'Singing, instruments, covers', ARRAY['sing','music','karaoke'])
on conflict (id) do nothing;

-- Basic RLS (tighten in production)
alter table users enable row level security;
-- (add policies as needed for your security model)
