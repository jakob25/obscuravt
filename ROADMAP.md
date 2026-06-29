# ObscuraVT Roadmap

> **Branch:** `staging` only until launch review  
> **Preview:** `obscuravt-git-staging-jakob25s-projects.vercel.app`  
> **Last updated:** 2026-06-28

---

## Shipped on Staging

### Core platform
- [x] Next.js 16 app shell, auth (JWT cookie), rate limits, Zod validation, security headers
- [x] Supabase-backed data layer (migrations `001`–`008`)
- [x] Role system (fan · streamer · admin) + widget dashboard customization
- [x] Marketing homepage for logged-out visitors (`MarketingHome`)
- [x] Help hub at `/help` (Getting Started, Your Circle, CMDI, Fan Corner, etc.)
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

### Brand assets (stored, not wired)
- [x] `public/fonts/govt-agent-bb.woff2` (+ italic)
- [x] `public/fonts/archive-stamp.woff2`
- [x] `public/fonts/top-secret-stamp.woff2`

---

## Phase 1 — Archive Identity (next)

Wire the custom fonts and lean into the classified-archive aesthetic without touching discover maps.

| Task | Notes |
|------|-------|
| [ ] `@font-face` in `globals.css` for all four woff2 files | `--font-govt`, `--font-archive`, `--font-stamp` tokens |
| [ ] Apply GovtAgentBB to dossier case headers, CMDI boards, help section titles | Regular + italic |
| [ ] Apply Archive Stamp to achievement badges, shop stamps, “verified” marks | Display-only |
| [ ] Apply Top Secret Stamp to classified banners, admin panels, redacted UI | Sparingly — hero accents |
| [ ] Audit contrast + fallbacks (Space Grotesk stays body default) | WCAG on gold-on-deep |

**Exit criteria:** Fonts load on staging preview with no layout shift; body text unchanged.

---

## Phase 2 — First-run & comprehension

Reduce bounce for new visitors and fans who land from marketing.

| Task | Notes |
|------|-------|
| [ ] Logged-out `/` → clear CTA path (Discover · Sign In · How It Works) | Already started; tighten copy |
| [ ] Post-signup onboarding nudge (add to Circle, validate a tag, place first bet) | Lightweight modal or checklist widget |
| [ ] Empty states on dashboard widgets | “Add creators to Your Circle” etc. |
| [ ] Help hub: add Collab, Corpo, Bets, Scraps worked examples | Match live UI screenshots/terms |
| [ ] Mobile pass on marketing + help pages | Playwright `mobile.spec.ts` green |

**Exit criteria:** New user can complete Circle + one fan action without asking what Scraps are.

---

## Phase 3 — Creator depth

Make claiming and running a dossier feel worth it.

| Task | Notes |
|------|-------|
| [ ] Profile claim flow UX (status, rejection reasons, resubmit) | `/creator` + claim button |
| [ ] CMDI creator dashboard: pick idea → set goal → notify Circle | End-to-end test |
| [ ] Analytics: safeCount coverage + empty charts for new claimants | Build already fixed TS error |
| [ ] Schedule vote + prediction moderation tools on dossier | Owner-only actions |
| [ ] Corpo multi-member pages: join/leave, shared promo slots | `/corpo/[slug]` |

**Exit criteria:** Claimed creator can run one CMDI cycle and see analytics without admin help.

---

## Phase 4 — Engagement loops

Tighten the daily habit, not new features.

| Task | Notes |
|------|-------|
| [ ] Your Circle feed: dedupe + ordering (CMDI · bets · memes · Q&A) | Widget + notifications parity |
| [ ] Notification preferences (per type) | DB column or JSON prefs |
| [ ] Weekly digest (`/weekly`) auto-populate from Circle activity | Monday reset logic |
| [ ] Bet voting phases: clearer UI for open → voting → resolved | API exists; polish UI |
| [ ] Achievement triggers audit (bet win, tag streak, CMDI fund) | Match `achievements` table |

**Exit criteria:** Returning fan sees meaningful Circle activity within 30s of login.

---

## Phase 5 — Economy & trust

| Task | Notes |
|------|-------|
| [ ] Vault Scraps ledger visibility on `/my-profile` | Transaction history |
| [ ] Shop cosmetics: equip/apply on user profile | `cosmetic_items` → UI |
| [ ] Scraps double-spend / race regression tests | API + Playwright |
| [ ] Admin audit log (approvals, tag edits, role changes) | `/admin` tab |
| [ ] RLS policy review on Supabase (service role vs anon paths) | Document in README |

**Exit criteria:** Scraps economy explainable and tamper-evident in admin view.

---

## Phase 6 — Launch prep

| Task | Notes |
|------|-------|
| [ ] Expand E2E: help, marketing, font load, CMDI happy path | `tests/` coverage |
| [ ] Lighthouse pass on `/`, `/discover`, `/vtuber/[id]` | Maps excluded from perf edits |
| [ ] `main` promotion checklist (env vars, Supabase prod, domain) | Separate from staging |
| [ ] Error monitoring (Vercel logs + optional Sentry) | Production only |
| [ ] PWA manifest + offline shell (optional) | Low priority |

**Exit criteria:** Staging stable 7 days, all critical paths green in CI, promote to production.

---

## Rules of engagement

1. **Staging only** — no direct `main` pushes without explicit approval.
2. **Surgical diffs** — no drive-by refactors; match existing patterns.
3. **Do not touch** Vibe Map, Niche Map, or `/discover` clustering logic unless fixing a confirmed bug.
4. **Verify on Vercel** after each push — deployment must reach `READY`.
5. **Data in Supabase** — tags, clusters, shop items, achievements via admin/SQL, not hardcoded.

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

Update checkboxes as work lands on `staging`.