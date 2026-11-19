# Humanize Public Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development **with parallel agents inside a batch** where files do not share writes. Batches are **sequential**: do not start batch N+1 until the human approved batch N. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite public prose (UI, SEO, CV, DB profile/projects) with the humanizer skill so it no longer reads as stock AI writing, without changing any fact, number, name, or tech claim.

**Architecture:** Four approved batches. Within a batch, dispatch parallel agents per locale or per file when there is no shared mutable state. Each rewrite uses `C:\Users\lucas\.claude\skills\humanizer\SKILL.md` (file mode). Fact-lock before commit. Chat/agent prompts are out of scope.

**Tech Stack:** Analog/Angular i18n (`de.ts`/`en.ts`), `localized-profile.ts`, SEO `page-seo-copy.ts`, `cv-data.ts`, Neon Postgres (`profiles`, `projects`), Vitest, humanizer skill.

**Spec:** `docs/superpowers/specs/2026-11-19-humanize-public-copy-design.md`

## Global Constraints

- Keep every fact, number, name, and tech claim identical — only wording/rhythm change.
- DE and EN wherever copy already exists; skip empty `descriptionEn` / `contentMarkdownEn`.
- Human approve each batch before the next.
- Keep `Robert Kameni Namou` and `PERSON_ALTERNATE_NAMES` verbatim; keep Angular TL / stack spine in SEO.
- Do not invent EN case studies; do not touch chat/agent system prompts.
- German **homepage** profile strings often come from `src/server/data/localized-profile.ts` (not only DB) — include that file in Batch 1.
- English homepage profile strings: `src/server/data/default-profile.ts` and/or DB `profiles` — Batch 1 edits code fallbacks; Batch 4a applies reviewed SQL if production DB diverges.
- Do not stage unrelated `ideas.md` moves.

## Parallelism rules

| Batch | Parallel OK | Sequential |
|-------|-------------|------------|
| 1 | Agent A: `en.ts` high-priority keys; Agent B: `de.ts` same keys; Agent C: `localized-profile.ts` + `default-profile.ts` prose | Merge + fact-lock + human approve, then commit |
| 2 | Agent A: `page-seo-copy.ts`; Agent B: `index.html` meta | One commit after approve |
| 3 | Single agent on `cv-data.ts` (one source of truth); asset regen after approve | |
| 4a | SQL draft for profile JSON after code fallbacks match | Apply only after human approve |
| 4b | One agent per project slug (parallel) writing markdown files under `.superpowers/sdd/humanize-projects/`; controller merges to SQL/admin updates | Apply after human approve |

---

### Task 1: Batch 1 — Site UI + localized profile (parallel)

**Files:**
- Modify: `src/app/shared/i18n/en.ts` — priority: `hero.*`, `about.*`, then `contact.adaptive*`, `twinInvite.description`, `chat` intro lines, `projects.description`
- Modify: `src/app/shared/i18n/de.ts` — same keys
- Modify: `src/server/data/localized-profile.ts` — German overrides for intro/hero/about/contact
- Modify: `src/server/data/default-profile.ts` — English fallback profile prose
- Test: `src/app/shared/i18n/site-copy.spec.ts` and any profile specs that pin exact strings — update expected copy only when assertions are exact-match

**Interfaces:**
- Consumes: humanizer skill; Global Constraints
- Produces: humanized strings; keys unchanged

**Parallel dispatch:**
- [ ] **Step 1a:** Subagent humanize `en.ts` high-priority sections (file mode). Read humanizer skill first. Fact-lock: preserve every metric/tech name present in the original keys.
- [ ] **Step 1b (parallel):** Same for `de.ts`.
- [ ] **Step 1c (parallel):** Humanize prose in `localized-profile.ts` + `default-profile.ts` (string literals only; keep structure/types).
- [ ] **Step 2:** Controller merges; run `npm run test:ci`; fix broken exact-string tests.
- [ ] **Step 3:** Present unified diff summary to human for Batch 1 approval.
- [ ] **Step 4 (after approve):** Commit

```bash
git add src/app/shared/i18n/en.ts src/app/shared/i18n/de.ts src/server/data/localized-profile.ts src/server/data/default-profile.ts
git commit -m "copy: humanize site UI and localized profile prose"
```

---

### Task 2: Batch 2 — SEO templates (parallel)

**Files:**
- Modify: `src/app/shared/seo/page-seo-copy.ts` (+ update `page-seo-copy.spec.ts` if exact strings asserted)
- Modify: `index.html` — `<title>`, `meta description`, `og:title`, `og:description`, `og:image:alt`, `twitter:title`, `twitter:description` only

**Constraints:** Keep `PERSON_NAME` and Angular / Technical Lead / TypeScript / RxJS / NgRx / Next.js signals in titles/descriptions.

- [ ] **Step 1a/1b (parallel):** Humanize `page-seo-copy.ts` and `index.html` meta.
- [ ] **Step 2:** `npx vitest run src/app/shared/seo/page-seo-copy.spec.ts`
- [ ] **Step 3:** Human approve.
- [ ] **Step 4:** Commit `copy(seo): humanize page meta templates and index.html`

---

### Task 3: Batch 3 — CV data + assets

**Files:**
- Modify: `src/app/pages/cv/cv-data.ts` — long prose only: `facts`, `profile`, `roles[].summary`, bullets, `projects[].summary`
- Leave structured lists (`skills.items`, `technologies`) unless clearly AI sentence-shaped
- After approve: regenerate `docs/cv/lebenslauf-robert-kameni-namou.docx` and `public/assets/cv/lebenslauf-robert-kameni-namou.{pdf,docx}` using the existing CV pipeline documented in repo/docs

- [ ] **Step 1:** Humanize `cv-data.ts` narrative fields; fact-lock all percentages, employer names, version numbers.
- [ ] **Step 2:** Human approve.
- [ ] **Step 3:** Regenerate PDF/DOCX; commit code + assets together.

```bash
git commit -m "copy(cv): humanize Lebenslauf prose and refresh printable assets"
```

---

### Task 4: Batch 4a — Profile DB sync (if production differs from code)

**Files:**
- Create under `docs/superpowers/specs/`: dated SQL using `jsonb_set` pattern from `2026-11-10-profile-refresh.sql`
- Only if live DB English (or stored) profile still has AI prose after Batch 1 code defaults

- [ ] **Step 1:** Compare `default-profile.ts` to live profile (Neon MCP `run_sql` read-only SELECT of title/intro excerpts — no writes yet).
- [ ] **Step 2:** If drift, draft SQL; human approve; apply with Neon tools or `prisma db execute --file`.
- [ ] **Step 3:** Commit SQL file only (no secrets).

---

### Task 5: Batch 4b — Project case studies (parallel per slug)

**Files / mechanism:**
- Read published projects from DB (or seed + live list). Seed slugs: `datev-kanzlei-management-platform-angular20`, `factoring-modernization-angular15-omnia-optica`, `deployment-control-platform-angular-monorepo-upgrade`, `employee-management-system-angular-springboot` — plus any extra live published slugs.
- Parallel: one subagent per slug writes humanized `description` + `contentMarkdown` (and EN twins only if non-empty) to `.superpowers/sdd/humanize-projects/<slug>.md`
- Apply via admin API or reviewed SQL `UPDATE` after human approve
- Markdown must still pass `validateProjectMarkdownContent`

- [ ] **Step 1:** Export current texts (read-only).
- [ ] **Step 2:** Parallel humanize per slug → preview files.
- [ ] **Step 3:** Human approve set.
- [ ] **Step 4:** Apply updates; spot-check one project page SSR.
- [ ] **Step 5:** Commit any SQL/docs used; do not commit `.superpowers/sdd` previews unless useful as audit trail in docs.

---

### Task 6: Close-out

- [ ] Confirm chat/agent prompts untouched.
- [ ] Note follow-on brainstorm for prompts.
- [ ] Open PR for the branch of copy commits (or stack on existing work).

## Spec coverage

| Spec item | Task |
|-----------|------|
| Batch 1 i18n | Task 1 |
| localized-profile / default-profile | Task 1 |
| Batch 2 SEO | Task 2 |
| Batch 3 CV + assets | Task 3 |
| Batch 4a Profile DB | Task 4 |
| Batch 4b Projects | Task 5 |
| Fact-lock + per-batch approve | All |
| Prompts deferred | Task 6 |
