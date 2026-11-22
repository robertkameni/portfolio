# EN case studies + locale toggle

Date: 2026-11-20  
Status: Approved (user: continue on recommended design)

## Problem

1. `descriptionEn` / `contentMarkdownEn` exist in Postgres but are empty on all eight published projects and unused in types, APIs, pages, and chat.
2. Visitors can reach EN via `?lang=` / Accept-Language, but there is no visible DE|EN control.
3. Chat always attaches the German case-study body even when the question is English.

## Decisions

### A. EN project bodies

- Translate each published project's non-empty DE `description` and `contentMarkdown` into `descriptionEn` / `contentMarkdownEn`.
- Fact-lock: keep numbers, employers, stack versions, routes, and feature claims identical; humanize EN prose the same way DE was humanized.
- Titles stay DE for now (no `titleEn` column).
- Empty EN remains empty only if the DE source is empty; otherwise both fields are filled.

### B. Locale-aware rendering

- Add a pure helper `localizedProjectField(de, en, locale)` that returns `en` when `locale === 'en'` and `en` is non-blank after trim; otherwise `de`.
- Project detail page uses it for description and markdown body.
- Project list / home cards use it for description.
- Client `Project` type gains optional `descriptionEn` and `contentMarkdownEn`.
- Public project APIs include those columns in responses (already present on full Prisma rows for detail; list select must add them).

### C. Chat case-study language

- `loadChatPromptContext` also selects `descriptionEn` and `contentMarkdownEn`.
- Detect message language with a small heuristic: English if the message matches common English tokens / Latin-only recruiter phrasing and does not match strong German signals (umlauts, "Erzähl", "deiner", "hast du", etc.); otherwise German. Prefer simple, tested rules over a library.
- Map each project through the same localized picker before `buildProjectPromptContext` so summary lines and the case-study body match the chosen language, with DE fallback when EN is empty.
- Scheduling withhold and 4,000-char trim stay unchanged.
- Update the contract test that currently forbids `contentMarkdownEn` in the loader.

### D. Locale toggle (fresh gap)

- Add `LocaleService.setLocale(locale: AppLocale)`: update the signal, write `localStorage['app-locale']`, sync `?lang=` via the router without full navigation churn, and reload localized profile via the existing portfolio store path.
- Add a DE|EN control in `site-toolbar` using the existing `toolbar-toggle` pattern, `aria-pressed`, placed in the right cluster before admin.
- SSR / hydration: first paint still comes from transfer state / `?lang=`; client toggle only runs after hydration.

### E. Polish

- Delete leftover local branches after this work lands on a PR branch: `backup/dossier-pre-rebase`, `fix/token-error-code-path`, `feat/humanize-visitor-agent-cleanup` (already merged).
- Keep `docs/ideas.md` Done entry from this branch.

## Non-goals

- Admin form fields for EN (apply via SQL/script this round).
- `titleEn` column.
- Translating every chat system-instruction string.
- Changing booking tools, rate limits, or visitor profile.

## Acceptance

- EN locale shows EN project description and body when EN columns are filled.
- English chat question attaches an EN case-study body when available.
- Toolbar DE|EN switches chrome locale and `?lang=` without hydration errors.
- Prod/preview UI spot-check covers: toggle, one EN project page, one EN Angular chat prompt.
- CI green on the PR; deep review completed.
