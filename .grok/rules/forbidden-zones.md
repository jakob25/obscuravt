# Forbidden zones

Do not edit these unless fixing a user-reported bug with reproduction steps:

## Discover / maps (frozen)

- `app/discover/page.tsx`
- `components/common/star-map.tsx`
- `components/common/niche-map.tsx`
- `hooks/use-star-map-data.ts`
- `hooks/use-niche-map-data.ts`

## VTuber profile cards (frozen styling)

- `components/vault/vault-surfaces.tsx` — `DossierFrame`, `CaseFolder`, `CasePhoto`
- `.dossier-frame`, `.archive-shell`, `.case-folder` in `app/globals.css`
- Dashboard featured VTuber tiles in `app/page.tsx` (`dossier-frame` class usage)

Backdrop and global layout changes must not alter card/dossier appearance.