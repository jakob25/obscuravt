# VTVault 🌟

> The ultimate VTuber discovery hub — beautiful Next.js frontend backed by the full Supabase-powered community platform from [jakob25/VTuber-Vault](https://github.com/jakob25/VTuber-Vault).

## What's Combined

| Feature | Source |
|---|---|
| Star Map (D3 constellation UI) | v0 Next.js build |
| Vibe Tags, Clip Cards, shadcn/ui components | v0 Next.js build |
| Auth (register/login/bcrypt) | Python Streamlit app |
| V-Coins economy (5,000 start, 250 daily bonus, 5% house cut) | Python Streamlit app |
| Community bets with voting + auto-resolution | Python Streamlit app |
| Achievements system (6 badges w/ coin rewards) | Python Streamlit app |
| Leaderboards (richest, most accurate, hall of loss) | Python Streamlit app |
| Real Supabase backend | Python Streamlit app |

## Tech Stack

- **Next.js 16** — App Router, API Routes
- **TypeScript** — end to end
- **Tailwind CSS v4** + **shadcn/ui** — all UI components
- **Supabase** — Postgres database, auth-ready
- **bcryptjs** — password hashing in API routes
- **D3** — star map visualization

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-username/vtvault.git
cd vtvault
pnpm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in the Supabase SQL editor
3. Copy your project URL and keys

### 3. Configure env

```bash
cp .env.example .env.local
# Fill in your Supabase credentials
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run dev

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
vtvault/
├── app/
│   ├── page.tsx                # Home dashboard
│   ├── layout.tsx              # Root layout + AuthProvider
│   ├── discover/               # Star Map
│   ├── clips/                  # Clip browser
│   ├── bets/                   # Community prediction market
│   ├── leaderboard/            # Richest / Accurate / Hall of Loss
│   ├── achievements/           # Badge showcase
│   ├── my-profile/             # Daily bonus, stats, role
│   ├── vtuber/[id]/            # VTuber profile pages
│   └── api/
│       ├── auth/register/      # POST — bcrypt register
│       ├── auth/login/         # POST — bcrypt login
│       ├── users/[username]/   # GET profile, PATCH (daily bonus, role)
│       ├── bets/               # GET all, POST create
│       ├── bets/place/         # POST wager
│       ├── bets/vote/          # POST vote + auto-resolve
│       ├── leaderboard/        # GET rich/accurate/losers
│       ├── achievements/       # GET all + user badges
│       └── shop/               # GET items, POST purchase
├── components/
│   ├── ui/                     # 50+ shadcn/ui components
│   ├── layout/                 # Navbar (auth-aware), ThemeProvider
│   └── common/                 # StarMap, ClipCard, VibeTag, AuthModal
├── lib/
│   ├── supabase.ts             # Supabase client (anon + admin)
│   ├── auth-context.tsx        # AuthProvider + useAuth hook
│   ├── db-constants.ts         # Game constants (STARTING_COINS, etc.)
│   ├── types.ts                # Core TypeScript interfaces
│   ├── mock-data.ts            # Seed data (pre-Supabase fallback)
│   └── utils.ts
└── supabase-schema.sql         # Full DB schema + RLS policies
```

## Game Economy

- **5,000 V-Coins** on registration
- **250 V-Coins** daily bonus (20hr cooldown)
- **5% house cut** on all bet pools
- **Auto-resolution**: bets resolve when ≥3 votes have a clear majority
- **Fallback**: unresolved bets auto-close after 6 days

## Achievements

| Badge | Condition | Reward |
|---|---|---|
| 💎 Gem Hunter | 5+ correct Hidden Gem bets | 800 coins |
| 🎲 High Roller | 10,000+ coins won lifetime | 2,000 coins |
| ⚖️ Tiebreaker | Deciding vote 5 times | — |
| 🔭 Indie Scout | Bets on 20+ different VTubers | — |
| 📡 Raid Master | 10+ correct Raid/Shoutout bets | — |
| 🎬 Clipper Legend | Submit 10+ clips | — |

## Roadmap

- [ ] VTuber submission form (create_vtuber page)
- [ ] Find My Oshi quiz (personality matching)
- [ ] Cosmetic shop UI
- [ ] Real-time bet updates via Supabase Realtime
- [ ] Clip timestamp linking to YouTube
- [ ] Admin panel for bet moderation

## Credits

- Frontend UI: built with [v0.dev](https://v0.dev)
- Backend logic: [jakob25/VTuber-Vault](https://github.com/jakob25/VTuber-Vault) Streamlit app

## License

MIT
