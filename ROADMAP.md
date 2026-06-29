# ObscuraVT Roadmap

> **Branch:** `staging` only until launch review  
> **Preview:** `obscuravt-git-staging-jakob25s-projects.vercel.app`  
> **Last updated:** 2026-06-28

---

## Shipped on Staging

### Core platform
- [x] Next.js 16 app shell, auth (JWT cookie), rate limits, Zod validation, security headers
- [x] Supabase-backed data layer (migrations `001`–`010`)
- [x] Role system (fan · streamer · admin) + widget dashboard customization
- [x] Marketing homepage for logged-out visitors (`MarketingHome`)
- [x] Help hub at `/help` (Getting Started, Your Circle, CMDI, Fan Corner, Bets, Scraps, etc.)
- [x] Navbar “How It Works” link

### Discovery (frozen — do not refactor map logic)
- [x] Vibe Map (D3) + Niche Map toggle on `/discover`
- [x] Find My Oshi quiz, search, tag validator, silhouette game
- [x] VTuber dossiers, nomination flow, admin approval

### Fan ↔ creator loops
- [x] Your Circle widget + notifications
- [x] Chat Made Me Do It (submit · pledge · creator pick goal)
- [x] Fan Corner (memes, Q&A, karaoke, schedule votes, predictions)
- [x] Clips hub, bets, leaderboards, achievements, shop, forums
- [x] Collab tools, Corpo pages, Stream Resources, analytics (claimed creators)

### Brand assets
- [x] `public/fonts/*.woff2` — wired via `@font-face` + utility classes
- [x] Site-wide vault backdrop (glow + grain + scanline static) — `SiteBackdrop` in root layout
- [x] Copy cleanup — `lib/site-copy.ts`, trimmed marketing/help, dossier real data
- [x] Discovery games hub — `/discovery-games`, `/silhouette`, `/crane` (migration `011`)
- [x] Agent handoff — `AGENTS.md`, `.grok/rules/`, `.grok/skills/obscuravt/`

---

## Phase 1 — Archive Identity ✅

| Task | Status |
|------|--------|
| [x] `@font-face` in `globals.css` for all four woff2 files | `--font-govt`, `--font-archive`, `--font-stamp` |
| [x] GovtAgentBB on dossier case headers, CMDI, help section titles | Regular + italic |
| [x] Archive Stamp on achievement badges, shop stamps | Display-only |
| [x] Top Secret Stamp on classified banners, admin panels | Sparingly |
| [x] Space Grotesk stays body default | WCAG fallbacks |

---

## Phase 2 — First-run & comprehension ✅

| Task | Status |
|------|--------|
| [x] Logged-out `/` → Discover · Sign In · How It Works CTAs | `MarketingHome` |
| [x] Post-signup onboarding checklist widget | `FirstRunChecklist` on dashboard |
| [x] Empty states on dashboard widgets | Circle, clips widgets |
| [x] Help hub: Bets, Scraps worked examples | `lib/help-content.ts` |
| [x] Help anchor nav + mobile tests | `/help` + `mobile.spec.ts` |

---

## Phase 3 — Creator depth ✅

| Task | Status |
|------|--------|
| [x] Profile claim UX (pending, claimed-by-other, resubmit path) | `ClaimProfileButton` + `/api/claim-status` |
| [x] Creator dashboard claim status | `/creator` |
| [x] CMDI pick → goal → notify Circle | `app/api/cmdmi/route.ts` |
| [x] Analytics empty charts for new claimants | `/analytics` |
| [x] Schedule vote + prediction moderation on dossier | `vtuber-engagement.tsx` owner actions |

---

## Phase 4 — Engagement loops ✅

| Task | Status |
|------|--------|
| [x] Your Circle feed priority sort | `app/api/your-circle/route.ts` |
| [x] Notification preferences (per type) | Migration `009` + `/api/notification-prefs` |
| [x] Weekly digest from Circle activity | `/api/weekly` auth + filter |
| [x] Bet voting phases UI | `voting` status on `/bets` |
| [x] Achievement triggers on bet win | `checkAchievements` in vote route |

---

## Phase 5 — Economy & trust ✅

| Task | Status |
|------|--------|
| [x] Vault Scraps ledger on `/my-profile` | Migration `010` + `/api/scraps/ledger` |
| [x] Shop cosmetics equip | `/api/shop/equip` |
| [x] Admin audit log | Migration `009` + `/admin` audit tab |
| [x] RLS policy notes | `README.md` |

---

## Phase 6 — Launch prep (in progress)

| Task | Status |
|------|--------|
| [x] Expand E2E: help, marketing, font load | `tests/pages.spec.ts`, `mobile.spec.ts` |
| [ ] Lighthouse pass on `/`, `/vtuber/[id]` | Manual — maps excluded |
| [ ] `main` promotion checklist | See below |
| [ ] Error monitoring (Vercel logs + optional Sentry) | Production only |
| [ ] PWA manifest (optional) | Low priority |

### Production promotion checklist

1. Run migrations `009`, `010`, and `011` on production Supabase
2. Confirm Vercel env vars: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, `ADMIN_USERNAMES`
3. Promote `staging` → `main` after 7-day stability window
4. Point custom domain; smoke-test auth, bets, shop, CMDI
5. Enable Vercel log drains / Sentry (optional)

---

## Rules of engagement

1. **Staging only** — no direct `main` pushes without explicit approval.
2. **Surgical diffs** — no drive-by refactors; match existing patterns.
3. **Do not touch** Vibe Map, Niche Map, or `/discover` clustering logic unless fixing a confirmed bug.
4. **Do not restyle** VTuber profile cards (`dossier-frame`, `DossierFrame`, `archive-shell`).
5. **Verify on Vercel** after each push — deployment must reach `READY`.
6. **Data in Supabase** — tags, clusters, shop items, achievements via admin/SQL, not hardcoded.
7. **Agents** — follow [AGENTS.md](./AGENTS.md) for full handoff instructions.

---

## Quick reference

| Area | Path |
|------|------|
| Marketing | `/` (logged out) |
| Help | `/help` |
| Discover | `/discover` |
| Fonts | `public/fonts/*.woff2` |
| Migrations | `db/migrations/` |
| Tests | `tests/*.spec.ts` |
| Agent rules | `AGENTS.md`, `.grok/rules/` |
| User copy | `lib/site-copy.ts` |
| Site backdrop | `components/layout/site-backdrop.tsx` |

Update checkboxes as work lands on `staging`.