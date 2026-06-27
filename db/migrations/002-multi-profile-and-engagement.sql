-- Run on staging Supabase before using new features

-- Multi-profile claiming
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_vtuber_id text;

CREATE TABLE IF NOT EXISTS user_claimed_profiles (
  username text NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  vtuber_id text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (username, vtuber_id)
);

-- Corpo / collective profiles
CREATE TABLE IF NOT EXISTS corpo_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  bio text NOT NULL DEFAULT '',
  banner_url text,
  member_vtuber_ids text[] NOT NULL DEFAULT '{}',
  created_by text NOT NULL REFERENCES users(username),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Memes / reactions
CREATE TABLE IF NOT EXISTS memes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vtuber_id text,
  submitted_by text NOT NULL REFERENCES users(username),
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  upvotes integer NOT NULL DEFAULT 0,
  share_slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Talk show Q&A
CREATE TABLE IF NOT EXISTS qa_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vtuber_id text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_by text NOT NULL REFERENCES users(username),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qa_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES qa_sessions(id) ON DELETE CASCADE,
  asked_by text NOT NULL REFERENCES users(username),
  question text NOT NULL,
  upvotes integer NOT NULL DEFAULT 0,
  answered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Karaoke requests
CREATE TABLE IF NOT EXISTS karaoke_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vtuber_id text NOT NULL,
  requested_by text NOT NULL REFERENCES users(username),
  song_title text NOT NULL,
  artist text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'done', 'rejected')),
  upvotes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Stream schedule voting
CREATE TABLE IF NOT EXISTS schedule_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vtuber_id text NOT NULL,
  proposed_day integer NOT NULL CHECK (proposed_day BETWEEN 0 AND 6),
  proposed_time text NOT NULL,
  label text,
  votes integer NOT NULL DEFAULT 0,
  created_by text NOT NULL REFERENCES users(username),
  created_at timestamptz NOT NULL DEFAULT now()
);