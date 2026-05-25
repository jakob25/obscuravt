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
  created_at timestamptz not null default now(),
  created_by text not null references users(username),
  category text not null default 'Other',
  result text
);

-- Bet entries (wagers placed)
create table if not exists bet_entries (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id) on delete cascade,
  username text not null references users(username),
  option text not null,
  amount integer not null,
  created_at timestamptz not null default now(),
  unique(bet_id, username)
);

-- Votes (community outcome verification)
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id) on delete cascade,
  username text not null references users(username),
  option text not null,
  created_at timestamptz not null default now(),
  unique(bet_id, username)
);

-- Clips
create table if not exists clips (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references vtuber_profiles(id) on delete set null,
  username text not null references users(username),
  title text not null,
  url text not null,
  thumbnail_url text,
  duration integer,
  views integer not null default 0,
  created_at timestamptz not null default now()
);

-- Achievements
create table if not exists achievements (
  id text primary key,
  name text not null,
  description text not null,
  reward_coins integer not null default 0,
  icon text not null default '🏆'
);

-- User badges (earned achievements)
create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  username text not null references users(username),
  achievement_id text not null references achievements(id),
  earned_at timestamptz not null default now(),
  unique(username, achievement_id)
);

-- Cosmetic shop items
create table if not exists cosmetic_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  type text not null,
  cost integer not null,
  preview_url text
);

-- User-owned cosmetics
create table if not exists user_cosmetics (
  id uuid primary key default gen_random_uuid(),
  username text not null references users(username),
  item_id uuid not null references cosmetic_items(id),
  equipped boolean not null default false,
  purchased_at timestamptz not null default now(),
  unique(username, item_id)
);

-- ── Seed achievements ──────────────────────────────────────────────────────
insert into achievements (id, name, description, reward_coins, icon) values
  ('gem_hunter',    'Gem Hunter',    'Correctly predict 5+ Hidden Gem bets',             800, '💎'),
  ('high_roller',   'High Roller',   'Win 10,000+ V-Coins lifetime',                    2000, '🎲'),
  ('first_vote',    'Tiebreaker',    'Cast the deciding vote 5 times',                     0, '⚖️'),
  ('indie_scout',   'Indie Scout',   'Place bets on 20+ different VTubers',                0, '🔭'),
  ('raid_master',   'Raid Master',   'Correctly predict 10+ Raid/Shoutout bets',           0, '📡'),
  ('clipper_legend','Clipper Legend','Submit 10+ clips to the Vault',                      0, '🎬')
on conflict (id) do nothing;

-- ── Row Level Security (recommended) ──────────────────────────────────────
-- Enable RLS on sensitive tables (users can read all, only write their own)
alter table users enable row level security;
alter table bet_entries enable row level security;
alter table votes enable row level security;
alter table user_badges enable row level security;
alter table user_cosmetics enable row level security;

-- Allow anon reads on public data
create policy "Public read bets" on bets for select using (true);
create policy "Public read vtuber_profiles" on vtuber_profiles for select using (true);
create policy "Public read clips" on clips for select using (true);
create policy "Public read achievements" on achievements for select using (true);
create policy "Public read cosmetic_items" on cosmetic_items for select using (true);
create policy "Public read leaderboard" on users for select using (true);

-- Note: API routes use service role key which bypasses RLS for writes
