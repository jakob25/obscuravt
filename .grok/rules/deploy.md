# Deploy rules

- Feature work on `staging`; merge to `main` for production releases.
- Production URL: https://obscuravt.com
- Run `pnpm run guard:layout` and `pnpm run build` before every push.
- After push, confirm the latest Vercel deployment for `obscuravt` is `READY`.
- Staging URL: `obscuravt-git-staging-jakob25s-projects.vercel.app`
- Do not redeploy production or change Vercel env vars without explicit approval.

## Cloud / unattended agents

- **Never** force-push `main` or `staging`.
- **Never** merge to `main` without explicit human approval.
- **Never** edit layout shell files (see `layout-shell.md`) unless fixing a confirmed layout bug.
- If Vercel build is `ERROR`, stop — do not push follow-up CSS “fixes” in a loop.

## GitHub protections (human setup)

Enable on repo **Settings → Branches** for `main` (and optionally `staging`):

1. Require pull request before merging (no direct pushes).
2. Require status check **CI / guard-and-build** to pass.
3. Restrict who can push to `main` (owner only).