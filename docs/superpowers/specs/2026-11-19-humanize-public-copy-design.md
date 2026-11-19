# Humanize public copy (UI, SEO, CV, DB)

Datum: 2026-11-19
Status: Approved design — pending implementation plan

## Goal

Rewrite public-facing prose so it reads like a human wrote it (humanizer skill), without inventing or dropping facts. Motivation: reduce AI-writing tells in indexed surfaces (site UI, SEO meta, Lebenslauf, project case studies). Chat/agent system prompts are explicitly deferred to a later brainstorm.

## Decisions locked

- **Scope (Option C):** Site UI copy, SEO titles/descriptions/`index.html` meta, German CV (`cv-data` + printable assets if needed), and DB public prose (profile JSON + project descriptions/markdown).
- **Facts (Option A):** Every fact, number, name, and tech claim stays identical — only wording and rhythm change.
- **Languages (Option A):** German and English wherever copy already exists; skip empty EN DB fields; no filling EN “for completeness.”
- **Landing (Option A):** Four batches with your approval after each before the next starts.
- **Approach:** Surface-batch humanizer passes (not inventory-score triage, not one mega-pass).

## Batch order

1. **Site UI chrome/prose in i18n** — `src/app/shared/i18n/de.ts` and `en.ts`. Rewrite marketing/descriptive strings. Leave tiny chrome labels alone unless they clearly read as AI marketing prose (e.g. keep “Kontakt”; rewrite long focus-card blurbs).
2. **SEO** — `src/app/shared/seo/page-seo-copy.ts` and static meta/OG in `index.html`. Keep full name **Robert Kameni Namou** and the Angular Technical Lead / stack spine; only de-AI surrounding wording. Do not drop `alternateName` identity constants.
3. **CV** — `src/app/pages/cv/cv-data.ts`. If printable strings change, regenerate `public/assets/cv/*` (PDF/DOCX) from the same source so HTML CV and files stay aligned. ATS headings and structure stay German.
4. **DB public prose**
   - **4a Profile:** `profiles` table string fields inside `title`, `intro`, `heroCards`, `skills`, `about`, `contact` (locale-aware content as stored).
   - **4b Projects:** `description`, `contentMarkdown`, and non-empty `descriptionEn` / `contentMarkdownEn`. Titles and tags stay unless a title is clearly AI-inflated *and* you approve changing it in that batch review.

## Process per batch

1. Inventory the batch (keys, file paths, or profile/project identifiers).
2. Mark AI tells using the humanizer skill patterns (staging contrasts, one-line closers, forced triads, dash stacks, inflation, stock AI diction, etc.).
3. Rewrite with humanizer file mode for code files; for DB, produce reviewed update payloads (SQL or admin-safe scripts) — never silent production writes without your go-ahead.
4. **Fact lock:** every number, employer/product proper noun, and tech token from the source must still appear in the rewrite.
5. You approve the batch → commit code and/or apply DB updates → only then start the next batch.

## Hard rules

- Do not invent metrics, employers, outcomes, or citations.
- Do not drop a supported claim to sound more human.
- DE and EN are rewritten independently (no translate-then-humanize round trip that can drift facts).
- Empty `descriptionEn` / `contentMarkdownEn` remain empty.
- No layout/design changes; no SEO architecture changes beyond wording inside existing meta templates.
- Person identity constants (`PERSON_NAME`, `PERSON_ALTERNATE_NAMES`) stay verbatim.

## Components

| Unit | Job |
|------|-----|
| Batch inventory | Checklist of strings for that batch |
| Humanizer pass | Rewrite prose; keep meaning |
| Fact lock | Before/after token verification |
| Approval gate | Human sign-off between batches |
| CV asset sync | Regenerate PDF/DOCX only when `cv-data` prose changes |

## Verification

- Fact list side-by-side for each batch.
- Spot-read for leftover AI tells.
- After code batches: relevant unit tests still pass; no accidental key renames breaking `SiteCopy` types.
- After DB batch: spot-check home + one project page in the browser.
- After CV asset regen: open PDF once for title/name sanity.

## Out of scope (this design)

- Chat/agent system prompts (follow-on brainstorm).
- Admin UI strings.
- Drafting new English case studies where EN fields are empty.
- Changing visual design, routing, or meta/JSON-LD architecture.

## Done when

Batches 1–4 are approved and landed; public surfaces no longer read as stock AI prose while every original fact remains; prompts still untouched and queued separately.

## Affected areas (expected)

- `src/app/shared/i18n/de.ts`, `en.ts` (+ specs if assertions pin exact copy)
- `src/app/shared/seo/page-seo-copy.ts` (+ spec), `index.html`
- `src/app/pages/cv/cv-data.ts`, possibly `public/assets/cv/*`, `docs/cv/*`
- Neon/`profiles` and `projects` rows (via reviewed SQL or existing admin/API update path documented in the plan)
