# EN Case Studies + Locale Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill English project bodies, render them when locale is EN, attach EN case studies in English chat, and add a visible DE|EN toolbar toggle.

**Architecture:** Pure `localizedProjectField` + message-language heuristic feed pages and chat. `LocaleService.setLocale` drives a toolbar toggle that updates signal, `localStorage`, and `?lang=`. EN copy is applied to Neon via parameterized SQL after a fact-locked translation pass.

**Tech Stack:** Angular 22 signals, AnalogJS Nitro chat routes, Vitest, Prisma/Neon, existing `toolbar-toggle` styles.

## Global Constraints

- Fact-lock on EN translations: numbers, employers, stack versions, routes, feature claims unchanged.
- DE fallback whenever EN is blank after trim.
- Titles stay German (no `titleEn`).
- No admin EN form this round.
- Chat scheduling withhold and 4,000-char case-study cap unchanged.
- Hydration-safe locale: no client re-resolve that disagrees with SSR transfer state on first paint.
- No em dashes in new prompt or UI chrome strings.

---

### Task 1: Localized field helper + Project type

**Files:**
- Create: `src/app/shared/i18n/localized-project-field.ts`
- Create: `src/app/shared/i18n/localized-project-field.spec.ts`
- Modify: `src/app/shared/types/project.types.ts`

**Interfaces:**
- Produces: `localizedProjectField(de: string | null | undefined, en: string | null | undefined, locale: AppLocale): string | null`
- Produces: optional `descriptionEn` / `contentMarkdownEn` on `Project`

- [ ] **Step 1: Write failing tests** for EN pick, DE fallback, blank EN, nulls.
- [ ] **Step 2: Implement helper + extend Project type + `toProjectPayload` if needed.**
- [ ] **Step 3: Run** `npx vitest run src/app/shared/i18n/localized-project-field.spec.ts`
- [ ] **Step 4: Commit** `feat(i18n): add localized project field helper`

---

### Task 2: LocaleService.setLocale + toolbar DE|EN

**Files:**
- Modify: `src/app/shared/services/locale.service.ts`
- Modify: `src/app/shared/components/site-toolbar/site-toolbar.ts`
- Modify: `src/app/shared/components/site-toolbar/site-toolbar.html`
- Test: add or extend a locale/toolbar spec if one exists; otherwise unit-test `setLocale` via a small service spec

**Interfaces:**
- Produces: `setLocale(locale: AppLocale): void` — updates signal, `localStorage['app-locale']`, sets `?lang=` via `Router`/`Location`, triggers `PortfolioStore.loadProfile()` when available without circular DI issues (inject optionally or call from toolbar)

- [ ] **Step 1: Failing tests for setLocale side effects (signal + localStorage).**
- [ ] **Step 2: Implement setLocale + toolbar toggles with `toolbar-toggle` and aria-pressed.**
- [ ] **Step 3: Run targeted vitest.**
- [ ] **Step 4: Commit** `feat(i18n): add DE/EN locale toggle in toolbar`

---

### Task 3: Wire project list + detail to EN fields

**Files:**
- Modify: `src/server/db/repositories/project.repository.ts` (`LIST_SELECT` add EN columns)
- Modify: `src/app/pages/projects/[slug]/index.page.ts` (`renderedMarkdown` + description binding)
- Modify: `src/app/pages/projects/[slug]/index.page.html` if description is inline
- Modify: home/projects list templates/components that show `project.description`

- [ ] **Step 1: Ensure list API returns EN columns; detail already returns full row.**
- [ ] **Step 2: Use `localizedProjectField` in detail markdown/description and list cards.**
- [ ] **Step 3: Add/adjust a focused unit test on the computed selection if practical.**
- [ ] **Step 4: Commit** `feat(projects): render EN description and body by locale`

---

### Task 4: Chat loads and picks EN case study

**Files:**
- Modify: `src/server/api/ai/chat/prompt-helpers.ts` (message locale heuristic + optional map helper)
- Modify: `src/server/api/ai/chat/chat-stream-shared.ts`
- Modify: `src/server/api/ai/chat/prompt-helpers.spec.ts`

**Interfaces:**
- Produces: `detectPromptLocale(message: string): AppLocale` (or `'de' | 'en'`)
- Produces: projects mapped to localized `description` / `contentMarkdown` before `buildProjectPromptContext`

- [ ] **Step 1: Failing tests for heuristic + EN body selection + loader contract.**
- [ ] **Step 2: Implement heuristic + loader select + mapping.**
- [ ] **Step 3: Run** `npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts`
- [ ] **Step 4: Commit** `feat(chat): attach EN case study for English questions`

---

### Task 5: Translate and apply EN bodies for 8 projects

**Files:**
- Create: `docs/superpowers/specs/2026-11-20-projects-en-sync.sql` (or apply script under `.superpowers/sdd/`)
- Create: working EN markdown drafts as needed under `.superpowers/sdd/en-projects/` (gitignored if huge; prefer SQL checked in)

- [ ] **Step 1: Export current DE description + contentMarkdown for each published slug from Neon.**
- [ ] **Step 2: Write fact-locked EN translations.**
- [ ] **Step 3: Apply UPDATE SQL to Neon; verify non-empty counts = 8.**
- [ ] **Step 4: Commit** SQL/docs `docs(projects): add EN case study sync`

---

### Task 6: Polish branches + ideas note

- [ ] **Step 1: Confirm ideas.md Done entry is on the branch.**
- [ ] **Step 2: Delete local branches** `backup/dossier-pre-rebase`, `fix/token-error-code-path`, `feat/humanize-visitor-agent-cleanup` after they are fully merged/obsolete.
- [ ] **Step 3: Commit any remaining docs polish if needed.**

---

### Task 7: Verify + PR + deep review

- [ ] **Step 1: Run** `npm run test:ci` (or targeted suites + typecheck/lint as in CI).
- [ ] **Step 2: UI spot-check** on preview/prod: locale toggle, EN project page, EN Angular chat chip.
- [ ] **Step 3: Push branch and create PR.**
- [ ] **Step 4: Deep review with Bugbot subagent on branch changes; fix critical findings.**
