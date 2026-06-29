# Deploy rules

- Feature work on `staging`; merge to `main` for production releases.
- Production URL: https://obscuravt.com
- Run `pnpm run build` (or `pnpm.cmd` on Windows) before every push.
- After push, confirm the latest Vercel deployment for `obscuravt` is `READY`.
- Staging URL: `obscuravt-git-staging-jakob25s-projects.vercel.app`
- Do not redeploy production or change Vercel env vars without explicit approval.