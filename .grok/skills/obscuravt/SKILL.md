---
name: obscuravt
description: >
  ObscuraVT staging development workflow. Use when working on jakob25/obscuravt:
  implementing ROADMAP items, pushing staging, verifying Vercel, Supabase migrations,
  or any ObscuraVT feature. Always read AGENTS.md and ROADMAP.md first.
metadata:
  short-description: "ObscuraVT repo workflow and guardrails"
---

# ObscuraVT

## Start here

1. Read [AGENTS.md](../../AGENTS.md) in repo root.
2. Read [ROADMAP.md](../../ROADMAP.md) for open tasks.
3. Confirm branch is `staging`.

## Workflow

1. Implement the smallest change that satisfies the task.
2. `pnpm run guard:layout` then `pnpm run build` with env vars from `.env.example`.
3. Commit and `git push origin staging`.
4. Verify Vercel deployment `READY`.

## Guardrails

- Do not refactor discover map logic.
- Do not restyle VTuber profile cards / dossier frames.
- Do not edit layout shell (`app/layout.tsx`, `site-backdrop.tsx`, `.site-backdrop*` / `.nav-rgb-shell` in `globals.css`) unless fixing a confirmed layout bug.
- Never force-push `main` or `staging`.
- User copy goes in `lib/site-copy.ts`.

## Migrations

If a feature needs new tables, add `db/migrations/NNN-name.sql` and document it in README + ROADMAP. Tell the user to run it in Supabase if you cannot.