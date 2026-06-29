# VTVault 🌟

> Find VTubers by vibe and tag, not sub count. Clips, bets, and community tools for fans and creators.

---

## Setup

```bash
git clone https://github.com/jakob25/VTVAULT-V2.git
cd VTVAULT-V2
pnpm install
cp .env.example .env.local   # fill in credentials
pnpm dev
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=          # openssl rand -base64 32
ADMIN_USERNAMES=jakob25,admin
```

---

## Database

Run migrations in order in your Supabase SQL editor:

1. `db/migrations/001-user-onboarding.sql` — roles, onboarding
2. `db/migrations/002-multi-profile-and-engagement.sql` — claimed profiles, memes, Q&A, karaoke, schedule votes, corpo
3. `db/migrations/003-tag-validator.sql` — tag validation streaks
4. `db/migrations/004-vault-uploads-storage.sql` — storage bucket policies
5. `db/migrations/005-notifications-and-tag-streak.sql` — notification types, tag streak
6. `db/migrations/006-cmdi-goals.sql` through `008-clips.sql` — CMDI, bets, clips
7. `db/migrations/009-notification-prefs.sql` — per-type notification toggles + admin audit log
8. `db/migrations/010-scrap-transactions.sql` — Vault Scraps ledger
9. `db/migrations/011-discovery-games.sql` — VTuber `silhouette_url` + crane catch log

**Discovery games:** `/discovery-games` hub · `/silhouette` (uploaded silhouettes per dossier) · `/crane` (claw machine with profile-pic prizes). Owners upload silhouettes from claimed dossiers.

`db/supabase-schema.sql` is a legacy stub; use the numbered migrations above for staging/prod.

### RLS and service role

API routes use `SUPABASE_SERVICE_ROLE_KEY` via `supabaseAdmin` — they bypass Row Level Security intentionally for server-side writes (bets, scraps, notifications). Client-side reads use the anon key where applicable. Do not expose the service role key to the browser. Review Supabase RLS policies on `users`, `bets`, and `notifications` before production: anon should read public tables only; writes go through Next.js API routes.

**Your Circle** depends on `users.favorite_vtubers` (comma-separated VTuber IDs). **Schedule votes** require migration `002` (`schedule_votes` table).

---

## Project Structure

```
├── app/
│   ├── page.tsx                    Home — customizable widget dashboard
│   ├── layout.tsx                  Root layout + AuthProvider + AddButton
│   ├── globals.css
│   │
│   ├── discover/                   Vibe Map + Niche Map toggle
│   ├── clips/                      Raw & edited clip browser
│   ├── bets/                       Community prediction market
│   ├── find-my-oshi/               Personality quiz
│   ├── search/                     Search by name / tag / constellation
│   ├── leaderboard/                Richest · Most Accurate · Hall of Loss
│   ├── achievements/               Badge showcase
│   ├── shop/                       Vault Scraps cosmetics
│   ├── notifications/              Notification inbox
│   ├── weekly/                     Weekly digest (resets Monday)
│   ├── forums/                     Per-constellation discussion boards
│   ├── tag-validator/              Rapid-fire tag confirm/challenge
│   ├── silhouette/                 VTuber guessing game
│   ├── creator/                    Creator dashboard (claimed profiles only)
│   ├── admin/                      VTuber approval + Tag Manager
│   ├── login/
│   ├── my-profile/                 User profile + daily bonus
│   ├── user/[username]/            Public user profiles
│   ├── vtuber/[id]/                Dossier profile (clips/photos/fanart/cmdmi/schedule)
│   │
│   ├── api/
│       ├── auth/login · register · logout · me
│       ├── bets/       GET·POST · place · vote
│       ├── clips/      GET·POST · vote
│       ├── cmdmi/      ideas · pledge
│       ├── fan-art/
│       ├── forums/     posts · vote
│       ├── leaderboard/
│       ├── notifications/
│       ├── photos/
│       ├── schedules/
│       ├── shop/       items · purchase
│       ├── tags/       GET·POST·PATCH·DELETE (admin)
│       ├── tag-validator/
│       ├── users/[username]/
│       ├── vtubers/    submit · claim
│       ├── weekly/
│       ├── admin/pending/
│
├── components/
│   ├── ui/                         shadcn/ui base components
│   ├── layout/navbar.tsx           Auth-aware nav + notification bell
│   ├── common/
│       ├── star-map.tsx            Vibe Map (D3 canvas, refs-only hot path)
│       ├── niche-map.tsx           Niche Map (content-based clusters)
│       ├── clip-card.tsx           Clip card with upvote + platform link
│       ├── photo-gallery.tsx       Glass · Flickr · 500px · Imgur · Twitter/X
│       ├── vibe-tag.tsx            Tag display (fetches from Supabase)
│       ├── collab-tools.tsx        Vibe matching + blind mode (Streamer only)
│       ├── dashboard-customizer.tsx Drag-and-drop widget config
│       ├── add-button.tsx          Global FAB — VTuber · Clip · Bet
│       ├── bet-submit-form.tsx
│       ├── clip-submit-form.tsx
│       ├── vtuber-submit-form.tsx
│
├── hooks/
│   ├── use-data.ts                 useVTubers · useClips · useBets · useVibeTags · useCanonicalTags
│   ├── use-star-map-data.ts        Vibe map — all cluster data from Supabase
│   ├── use-niche-map-data.ts       Niche map — cluster + content mappings from Supabase
│
├── lib/
│   ├── session.ts                  JWT httpOnly cookie session (jose)
│   ├── rate-limit.ts               Sliding window rate limiter
│   ├── validation.ts               Zod schemas + input sanitization
│   ├── security.ts                 CSP + security headers
│   ├── auth-context.tsx            React auth context (cookie-based)
│   ├── supabase.ts                 Supabase client (anon + admin)
│   ├── db-constants.ts             STARTING_COINS · DAILY_BONUS · CATEGORIES · ROLES
│   ├── types.ts                    All TypeScript interfaces
│   ├── embed-utils.ts              YouTube/Twitch embed helpers
│   ├── photo-utils.ts              Multi-platform photo URL parser
│   ├── utils.ts                    cn() + shared helpers
│
├── middleware.ts                   Security headers on every response
├── supabase-schema.sql             Full schema + RLS + seed data
├── .env.example
```

---

## Self-Sustaining Data

Everything discovery-critical lives in Supabase, not code:

| What | Where | How to add more |
|---|---|---|
| Vibe constellations | `canonical_tags` where `category='cluster'` | INSERT with color, position_x, position_y, description |
| Niche clusters | `canonical_tags` where `category='niche_cluster'` | INSERT with above + content_tag_ids array |
| Vibe tags | `canonical_tags` where `category='vibe'` | INSERT — auto-appears in all tag UIs |
| Content tags | `canonical_tags` where `category='content'` | INSERT — auto-maps to niche clusters |
| VTubers | `vtubers` table | Submit via UI → admin approves |
| Achievements | `achievements` table | INSERT — auto-checked on bet win |
| Shop items | `cosmetic_items` table | INSERT — appears in shop immediately |

Admin panel (`/admin`) has a Tag Manager tab for adding/removing tags without touching SQL.

---

## Security

| Layer | Implementation |
|---|---|
| Sessions | Signed JWT in httpOnly cookie (jose), never localStorage |
| Rate limiting | Auth 10/15min · Writes 30/min · Transactions 20/min |
| Validation | Zod schemas on every POST, HTML stripped from all inputs |
| Authorization | `requireAuth()` on all writes — username from session, never body |
| Admin | `requireAdmin()` reads `ADMIN_USERNAMES` env var |
| Headers | CSP · X-Frame-Options · HSTS · X-Content-Type-Options (middleware) |
| Scraps | Server re-verifies balance before every transaction |

---

## Tech Stack

Next.js 16 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase · D3 · bcryptjs · jose · zod

---

## Credits

UI: [v0.dev](https://v0.dev) · Backend logic: [jakob25/VTuber-Vault](https://github.com/jakob25/VTuber-Vault) · Built with Claude

## License

MIT
