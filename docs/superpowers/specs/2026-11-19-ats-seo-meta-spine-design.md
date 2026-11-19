# ATS + SEO meta spine (A→C)

Datum: 2026-11-19
Status: Approved design — pending implementation plan

## Goal

Public pages must be findable two ways:

1. **Stack search** — recruiter looks for the stack Robert uses (Angular TL, TypeScript, etc.)
2. **Name search** — recruiter looks for name variants: `Robert Kameni Namou`, `Robert Kameni`, `Robert Namou`, `Kameni Namou`

Crawlable DE/EN meta and structured data on existing routes. ATS assets (HTML CV, PDF, DOCX) stay aligned with the same identity. No skill-only landing URLs.

Success: SSR HTML for `/`, `/cv`, `/projects`, and `/projects/:slug` carries unique title, description, canonical, and JSON-LD that reflect the Angular Technical Lead spine **and** the full legal name plus discoverable name variants; printable CV assets still parse cleanly and match that spine.

## Positioning (inferred)

Source of truth: `src/app/pages/cv/cv-data.ts`.

- Primary: Technical Lead Frontend Engineer / Frontend-Architekt — Angular (v8–v22), TypeScript, RxJS, NgRx / Signals
- Secondary: Next.js / React
- Do not invent a full-stack-generalist pitch that contradicts the CV

## Approach

**Meta spine first (Phase A), deepen projects later (Phase C).**

Harden existing public routes before adding narrative depth. Architecture does not change between A and C — only content richness and optional locale URL alternates.

## Architecture

One shared head layer. Extend `PageMetaService` so every public route applies locale-aware title, description, canonical, and Open Graph, plus a JSON-LD script managed with the same apply/restore lifecycle as meta tags.

Surfaces in scope: `/`, `/projects`, `/projects/:slug`, `/cv`. Admin, `/api`, and project edit stay non-indexable via existing `robots.txt`.

Keyword spine for all meta templates: full name + CV headline + core skills. Home, projects list/detail, and CV titles/descriptions reuse that spine. No separate SEO keyword file that can drift from the CV.

### Name discovery

Canonical display name everywhere: **Robert Kameni Namou**.

JSON-LD `Person` on home and CV must set:

- `name`: `Robert Kameni Namou`
- `alternateName`: `["Robert Kameni", "Robert Namou", "Kameni Namou"]`

Page titles and descriptions for home and `/cv` include the full name naturally (already typical for CV titles). Do not keyword-stuff every variant into visible body copy or every project title — variants live in structured data + natural full-name usage in titles/descriptions. Visible H1 / CV header remains the full name only.

## Components

### 1. `PageMetaService` (extended)

Keeps today’s apply/restore pattern. Gains:

- JSON-LD `<script type="application/ld+json">` write and clear on restore
- Optional `robots` meta when a route must stay noindex (only if a public route needs it; admin already Disallow’d)
- No fake `hreflang` pairs while DE and EN share the same path (see Bilingual)

Still the only module that mutates `<head>` for routes.

### 2. Route meta callers

Home, projects list, project detail, and CV each call `pageMeta.apply(...)` on enter and `restore()` on destroy (same pattern as `/cv` today).

- Project detail: title/description from project title + tech list + Angular TL spine
- CV: keeps German `lang` override for print/ATS regardless of visitor locale

### 3. SEO copy bundle

Small DE/EN title and description templates next to existing site-copy. Values must stay consistent with `cv-data.ts`. If the CV headline or core skills change, meta templates update in the same change.

### 4. JSON-LD builders (pure functions)

- Home / sitewide: `Person` + `WebSite` (`Person.name` + `alternateName` as above)
- CV: `Person` with `name`, `alternateName`, `jobTitle`, and `knowsAbout` aligned to CV skills
- Project detail: minimal `CreativeWork` in Phase A (title, url, keywords from tech tags); richer fields in Phase C when body depth exists. Prefer `CreativeWork` over `SoftwareApplication` — these are case studies, not installable products.

Canonical URLs always go through existing `absoluteUrl` / `SITE_ORIGIN` (`https://cv.lucastar.de` by default). Sitemap shape stays as in `buildSitemapEntries` — do not invent a second origin for OG or JSON-LD.

## Data flow

1. SSR resolves locale from `Accept-Language` via `LocaleService`
2. Route builds `PageMeta` + JSON-LD payload from SEO copy + page data
3. `PageMetaService.apply` writes title, description, OG, canonical, `html[lang]` (or CV lang override), and JSON-LD
4. On destroy or navigation away: `restore` returns head to the saved baseline
5. Client locale switch: active route re-applies meta for the new locale

## Bilingual reality

Locales share the same path today (no `/de` or `/en` tree). Emitting `hreflang` that points DE and EN at the same URL is invalid for Google.

Phase A:

- Meta, `html[lang]`, and JSON-LD follow the **rendered** locale
- CV stays German-fixed for ATS/print
- Do **not** ship fake hreflang pairs

Phase A follow-on (same design, may land with A or immediately after): introduce one crawl-stable locale signal (`?lang=de|en` **or** a path prefix — choose one in the implementation plan) so real `hreflang` alternates can exist. Until that ships, bilingual means switcher + SSR locale, not alternate-URL SEO.

## ATS alignment

HTML CV, hosted PDF, and DOCX keep shared identity: full name **Robert Kameni Namou**, headline, and skill labels (`Kenntnisse` and role technologies). JSON-LD `jobTitle` / `knowsAbout` read from that spine — not a divergent marketing blurb.

Phase A does not require regenerating PDF/DOCX unless a string drift is found during implementation. If drift exists, fix assets in the same change set as the meta spine.

## Phase C (after A, same design)

- Enrich project pages: visible tech list + short case narrative that uses real stack terms (no stuffing, no doorway pages)
- Complete richer project JSON-LD when body depth is enough
- Optional locale URL signal + real `hreflang` if not done in A follow-on
- No new skill-only landing routes

## Edge cases

- Project missing tech tags: description = title + spine; JSON-LD omits empty `keywords`
- Locale switch mid-navigation: last `apply` wins; `restore` undoes the single saved baseline (no nested save stack — same as today’s CV pattern)
- Missing `SITE_ORIGIN`: keep `absoluteUrl` defaults; never invent a second origin

## Testing

- JSON-LD builders: required `@context` / `@type`, no empty `knowsAbout` / `keywords` arrays when data is missing
- `PageMetaService`: apply sets title, description, canonical, JSON-LD; restore clears route-owned tags without leaking to the next route
- Meta templates: resolve per locale and include the Angular TL spine plus full name on home/CV
- JSON-LD `Person`: `name` and all three `alternateName` values present
- SSR smoke (existing harness if present): `/`, `/cv`, `/projects/:slug` HTML contains unique `<title>`, meta description, and one `ld+json` block; home/CV title contains `Robert Kameni Namou`

## Out of scope

- Skill / role landing pages (e.g. standalone “Angular Entwickler” URLs)
- Search Console verification or GSC API as product code
- Changing `robots.txt` allow/disallow policy (unless a bug contradicts this design)
- Admin or API indexing
- Inventing English CV print assets (CV page remains DE for ATS)

## Affected areas (expected)

- `src/app/shared/services/page-meta.service.ts` (+ specs)
- New small SEO copy + JSON-LD helper modules under `src/app/shared/` (exact paths in the plan)
- `src/app/pages` home, projects list/detail, CV route entrypoints
- Possibly `docs/cv` / `public/assets/cv` only if identity drift is found
- Locale URL / hreflang only in the A follow-on slice

## Nicht-Ziele (reminder)

- No dual-surface ATS export pipeline rewrite
- No content-led homepage rewrite as a prerequisite for meta
- No stuffing every name variant into body copy or project titles — structured `alternateName` + natural full-name titles are enough
- Success bar is **both** stack-keyword discovery and name-variant discovery, not one at the expense of the other
