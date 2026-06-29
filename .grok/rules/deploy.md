# Deploy rules

- Push only to `staging` unless the user explicitly approves `main`.
- Run `pnpm run build` (or `pnpm.cmd` on Windows) before every push.
- After push, confirm the latest Vercel deployment for `obscuravt` is `READY`.
- Staging URL: `obscuravt-git-staging-jakob25s-projects.vercel.app`
- Do not redeploy production or change Vercel env vars without explicit approval.