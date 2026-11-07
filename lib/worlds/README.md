# Fictional worlds

Scope: admin-curated public lore, multiple dossier memberships, optional cast descriptions without separate accounts. No ownership inference, claims, ranking, external lookups, or automatic clip reassignment.

## Rollout order (shared staging/production database)

1. Review the additive SQL migration and access policy before applying it. It adds kind (default corpo), world_details JSON, a partial membership index and SELECT-only world policy. Existing table was verified RLS-enabled with no policies; direct client writes remain denied.
2. Deploy this branch to a preview. Migration failure degrades world links to hidden and world routes to an explicit unavailable state. The legacy group queries also need the new kind column, so apply migration before deployment.
3. Test admin auth (anonymous 401, ordinary account 403), create/edit/remove a test world only in an isolated test database, multi-dossier membership and one-dossier/two-character cast. Sources required for every link and character. No real-world affiliations are seeded.
4. Check narrow phone layout, long names/lore/source links, and a dossier with several worlds. Admin management route is /admin/worlds; no navbar changes.
5. Review and promote only after testing. Keep shared-database writes in mind: do not seed example or unverified worlds on the shared project.

Public routes: /worlds/[slug] and dossier membership links. Public text is escaped by React; source links allow HTTPS without embedded credentials. Sources are not fetched by the server. Management is restricted by requireAdmin and a kind=world predicate; the older corpo edit API refuses world rows. Removing a world does not delete profiles or clips.

Existing two lib/validation.test.ts sanitizer expectations fail in the unchanged baseline; keep separate from world test results. No sanitizer changes belong in this feature.
