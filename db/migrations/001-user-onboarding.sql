-- Run in Supabase SQL editor (staging first)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_version text;