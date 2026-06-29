# ObscuraVT — Agent Instructions

You own ongoing development on this repo. Read this file first every session.

## Project

| Item | Value |
|------|-------|
| Product | ObscuraVT — VTuber discovery, clips, bets, fan/creator tools |
| Repo | https://github.com/jakob25/obscuravt |
| Active branch | `staging` only (no `main` pushes without explicit user approval) |
| Staging preview | https://obscuravt-git-staging-jakob25s-projects.vercel.app |
| Vercel project | `obscuravt` (team `jakob25s-projects`) |
| Stack | Next.js 16 · TypeScript · Tailwind v4 · Supabase · Playwright |

## Your job

1. Implement tasks from [ROADMAP.md](./ROADMAP.md) on `staging`.
2. Run build + push + confirm Vercel deployment `READY` after each meaningful change.
3. Keep diffs surgical — match existing patterns; no drive-by refactors.
4. Execute commands yourself; do not tell the user what to run.

## Forbidden (unless fixing a confirmed bug)

- **Discover maps** — `app/discover/page.tsx`, `components/common/star-map.tsx`, `components/common/niche-map.tsx`, clustering/hook logic for vibe/niche maps.
- **VTuber profile cards** — `.dossier-frame`, `DossierFrame`, `CaseFolder`, `CasePhoto`, `archive-shell` styling and components in `components/vault/vault-surfaces.tsx`. Do not restyle dossier tiles on the dashboard (`app/page.tsx` featured VTuber cards).
- **Direct `main` branch pushes** or production promotion without explicit approval.

## Protected patterns

- User-facing copy: centralize in [`lib/site-copy.ts`](lib/site-copy.ts). Terse vault tone; no marketing slop.
- Help FAQ: [`lib/help-content.ts`](lib/help-content.ts). Use "Vault Scraps" not "V-Coins".
- Dossier sidebar data: [`lib/vtuber-dossier-data.ts`](lib/vtuber-dossier-data.ts).
- Site-wide background only: [`components/layout/site-backdrop.tsx`](components/layout/site-backdrop.tsx) + `.site-backdrop*` in `globals.css`. Never attach backdrop styles to cards or dossiers.

## Environment

Copy [`.env.example`](.env.example) → `.env.local`. All four vars required for `next build`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
ADMIN_USERNAMES=jakob25,admin
```

Vercel staging already has real Supabase env. Local builds need dummy or real values.

## Commands

```bash
pnpm install
pnpm dev                    # http://localhost:3000
pnpm run build              # must pass before push
pnpm run typecheck
pnpm test                   # Playwright (needs dev server or staging config)
```

**Windows / PowerShell:** if `pnpm` is blocked, use `cmd /c "pnpm.cmd run build"`. Git commits: `Set-Location 'path'; git commit -m 'message'` with single-quoted messages.

## Database migrations

Run in Supabase SQL editor in order (`db/migrations/001` … `011`). Staging may still need:

- `009-notification-prefs.sql`
- `010-scrap-transactions.sql`
- `011-discovery-games.sql`

Features degrade gracefully with migration hints if tables/columns are missing.

## Deploy workflow

1. `git checkout staging && git pull`
2. Make changes, `pnpm run build`
3. `git add` → `git commit` → `git push origin staging`
4. Verify Vercel deployment `READY` (MCP `vercel` tools or dashboard). Commit message should appear on latest deployment.

## Verification checklist

- [ ] `next build` green
- [ ] No new `href="#"` placeholder links in user UI
- [ ] Discover map still renders (canvas visible)
- [ ] Dossier/profile cards visually unchanged unless task explicitly requests it
- [ ] Push to `staging`; Vercel `READY`

## Architecture (quick)

```
app/           Pages + API routes (app/api/*)
components/    UI — vault/* (dossier), common/* (maps, cards), layout/*
lib/           session, supabase, validation, site-copy, types
hooks/         use-data, use-star-map-data, use-niche-map-data
db/migrations/ Numbered SQL — source of truth for schema
tests/         Playwright specs
```

API routes use `supabaseAdmin` (service role) server-side. Never expose service role to the browser.

## Current priorities (ROADMAP Phase 6)

- [ ] Lighthouse pass on `/`, `/vtuber/[id]` (exclude map canvas)
- [ ] `main` promotion checklist (after 7-day staging stability)
- [ ] Optional: error monitoring, PWA manifest

Recently shipped on staging: AI slop cleanup, `site-copy.ts`, dossier real data, discovery games (silhouette + crane), site-wide vault backdrop.

## When stuck

- Read [ROADMAP.md](./ROADMAP.md) for phase status and rules of engagement.
- Read [README.md](./README.md) for setup, migrations, RLS notes.
- Check live API shape before querying Supabase (schema drift: bets use `vtuber_name` + `options[]`; CMDI uses `profile_id`, `cmdmi_ideas`, `cmdmi_goals` with `funded_amount`/`goal_amount`).