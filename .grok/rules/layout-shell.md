# Layout shell — frozen

Do not edit these files unless fixing a **confirmed layout bug** with reproduction steps and a passing `pnpm run guard:layout`.

## Files

- `app/layout.tsx` — root `<html>` / `<body>` structure
- `app/globals.css` — only the **site-wide** sections:
  - `.site-backdrop*` (lines ~195–258)
  - `.nav-rgb-shell` and nav RGB glitch keyframes (~1009+)
- `components/layout/site-backdrop.tsx`

## Required invariants (enforced by `scripts/guard-layout.mjs`)

| Rule | Why |
|------|-----|
| `<body>` has `bg-vault-deep`, **no** `isolate` | `isolate` + negative z-index backdrop hid the vault background on edges |
| App wrapped in `relative z-10 flex min-h-screen flex-col` | Keeps content above fixed backdrop |
| `.site-backdrop` z-index ≥ 0 | Negative z-index trapped backdrop behind body |
| No `overflow: hidden` on `html`, `body`, or `.nav-rgb-shell` | Clipped sides/bottom of the page |
| `.nav-rgb-shell` uses `overflow-x: clip`; FX lives in `.nav-rgb-fx` | Nav RGB glitch must not widen the page |
| `globals.css` stays ~1100+ lines | Cloud agent once deleted 1000+ lines in one commit |

## Agent workflow

1. Never bulk-edit or “simplify” `globals.css`.
2. Never add global `overflow-x: hidden` to fix nav glitch — fix the glitch animation instead.
3. Run `pnpm run guard:layout` before every push touching layout/CSS.
4. Cloud / unattended agents: **staging only**, never force-push `main`.