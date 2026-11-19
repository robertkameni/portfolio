# ATS + SEO Meta Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/`, `/cv`, `/projects`, and `/projects/:slug` emit locale-aware meta + JSON-LD so recruiters find the site by stack keywords *and* by name variants (`Robert Kameni Namou`, `Robert Kameni`, `Robert Namou`, `Kameni Namou`), while ATS identity stays aligned.

**Architecture:** Extend `PageMetaService` with JSON-LD apply/restore. Pure builders supply `Person` / `WebSite` / `CreativeWork`. Thin DE/EN SEO templates sit next to site-copy and reuse the CV spine. Routes call `apply`/`restore` like `/cv` already does. No skill landing pages. Fake same-URL `hreflang` is out; real alternates land in Task 6 via `?lang=`.

**Tech Stack:** Analog.js + Angular 22 SSR, existing `PageMetaService`, `LocaleService`, `absoluteUrl` / `SITE_ORIGIN`, Vitest (`npm run test:ci`), TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-19-ats-seo-meta-spine-design.md`

## Global Constraints

- Canonical display name: `Robert Kameni Namou` (verbatim).
- `Person.alternateName`: exactly `["Robert Kameni", "Robert Namou", "Kameni Namou"]`.
- Stack spine from `cv-data.ts`: Technical Lead Frontend / Angular (v8–v22), TypeScript, RxJS, NgRx; secondary Next.js/React — do not invent a full-stack-generalist pitch.
- CV page stays `lang: 'de'` for print/ATS.
- Canonicals via `absoluteUrl` / default origin `https://cv.lucastar.de` — never invent a second origin.
- No skill-only landing routes. No stuffing every name variant into body copy or project titles.
- No nested save stack in `PageMetaService` — keep single baseline save like today.
- Tests: `npm run test:ci` green after every task. One commit per task.
- Do not stage unrelated `ideas.md` / `docs/ideas.md` moves in these commits.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/app/shared/seo/person-identity.ts` | Canonical name + alternateName constants |
| `src/app/shared/seo/json-ld.ts` | Pure builders: Person, WebSite graph, CreativeWork |
| `src/app/shared/seo/json-ld.spec.ts` | Builder tests |
| `src/app/shared/seo/page-seo-copy.ts` | DE/EN title/description templates for home, projects, CV |
| `src/app/shared/seo/page-seo-copy.spec.ts` | Template tests (name + stack spine) |
| `src/app/shared/services/page-meta.service.ts` | Head mutations + JSON-LD script lifecycle |
| `src/app/shared/services/page-meta.service.spec.ts` | apply/restore tests |
| `src/app/pages/index.page.ts` | Home meta + Person/WebSite JSON-LD |
| `src/app/pages/cv/index.page.ts` | CV meta from templates + Person JSON-LD (keep lang `de`) |
| `src/app/pages/projects/index.page.ts` | Projects list meta |
| `src/app/pages/projects/[slug]/index.page.ts` | Project detail meta + CreativeWork |
| `src/server/utils/site-url.ts` | Unchanged API; callers use `absoluteUrl` |

Phase A follow-on (Task 6): locale query + hreflang helpers — only after Tasks 1–5.

---

### Task 1: Person identity + JSON-LD builders

**Files:**
- Create: `src/app/shared/seo/person-identity.ts`
- Create: `src/app/shared/seo/json-ld.ts`
- Create: `src/app/shared/seo/json-ld.spec.ts`

**Interfaces:**
- Produces:
  - `PERSON_NAME = 'Robert Kameni Namou'`
  - `PERSON_ALTERNATE_NAMES = ['Robert Kameni', 'Robert Namou', 'Kameni Namou'] as const`
  - `buildPersonJsonLd(input: { jobTitle: string; knowsAbout: string[]; url: string }): Record<string, unknown>`
  - `buildWebsiteJsonLd(input: { url: string; name: string }): Record<string, unknown>`
  - `buildPersonWebsiteGraph(person: …, website: …): Record<string, unknown>` — `@graph` with both
  - `buildCreativeWorkJsonLd(input: { name: string; url: string; description?: string; keywords?: string[] }): Record<string, unknown>`
  - Omit empty `knowsAbout` / `keywords` arrays entirely (do not emit `[]`)

- [ ] **Step 1: Write the failing tests**

Create `src/app/shared/seo/json-ld.spec.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { PERSON_ALTERNATE_NAMES, PERSON_NAME } from './person-identity';
import { buildCreativeWorkJsonLd, buildPersonJsonLd, buildPersonWebsiteGraph, buildWebsiteJsonLd } from './json-ld';

describe('person identity', () => {
  it('uses the full legal name and the three search variants', () => {
    expect(PERSON_NAME).toBe('Robert Kameni Namou');
    expect([...PERSON_ALTERNATE_NAMES]).toEqual(['Robert Kameni', 'Robert Namou', 'Kameni Namou']);
  });
});

describe('buildPersonJsonLd', () => {
  it('emits Person with name, alternateName, jobTitle, and knowsAbout', () => {
    const json = buildPersonJsonLd({
      jobTitle: 'Technical Lead Frontend Engineer',
      knowsAbout: ['Angular', 'TypeScript'],
      url: 'https://cv.lucastar.de/',
    });
    expect(json['@context']).toBe('https://schema.org');
    expect(json['@type']).toBe('Person');
    expect(json['name']).toBe('Robert Kameni Namou');
    expect(json['alternateName']).toEqual(['Robert Kameni', 'Robert Namou', 'Kameni Namou']);
    expect(json['jobTitle']).toBe('Technical Lead Frontend Engineer');
    expect(json['knowsAbout']).toEqual(['Angular', 'TypeScript']);
    expect(json['url']).toBe('https://cv.lucastar.de/');
  });

  it('omits knowsAbout when empty', () => {
    const json = buildPersonJsonLd({ jobTitle: 'Engineer', knowsAbout: [], url: 'https://cv.lucastar.de/' });
    expect(json).not.toHaveProperty('knowsAbout');
  });
});

describe('buildCreativeWorkJsonLd', () => {
  it('omits empty keywords and optional blank description', () => {
    const json = buildCreativeWorkJsonLd({ name: 'Case', url: 'https://cv.lucastar.de/projects/case', keywords: [] });
    expect(json['@type']).toBe('CreativeWork');
    expect(json).not.toHaveProperty('keywords');
    expect(json).not.toHaveProperty('description');
  });

  it('includes keywords when present', () => {
    const json = buildCreativeWorkJsonLd({
      name: 'Case',
      url: 'https://cv.lucastar.de/projects/case',
      description: 'Angular case study',
      keywords: ['Angular', 'TypeScript'],
    });
    expect(json['keywords']).toEqual(['Angular', 'TypeScript']);
    expect(json['description']).toBe('Angular case study');
  });
});

describe('buildPersonWebsiteGraph', () => {
  it('wraps Person and WebSite in @graph', () => {
    const graph = buildPersonWebsiteGraph(
      buildPersonJsonLd({ jobTitle: 'TL', knowsAbout: ['Angular'], url: 'https://cv.lucastar.de/' }),
      buildWebsiteJsonLd({ url: 'https://cv.lucastar.de/', name: 'Robert Kameni Namou' }),
    );
    expect(graph['@context']).toBe('https://schema.org');
    expect(Array.isArray(graph['@graph'])).toBe(true);
    expect((graph['@graph'] as unknown[]).length).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run src/app/shared/seo/json-ld.spec.ts`

Expected: FAIL (module not found / exports missing).

- [ ] **Step 3: Implement identity + builders**

`src/app/shared/seo/person-identity.ts`:

```typescript
export const PERSON_NAME = 'Robert Kameni Namou';

export const PERSON_ALTERNATE_NAMES = ['Robert Kameni', 'Robert Namou', 'Kameni Namou'] as const;
```

`src/app/shared/seo/json-ld.ts`:

```typescript
import { PERSON_ALTERNATE_NAMES, PERSON_NAME } from './person-identity';

export function buildPersonJsonLd(input: {
  jobTitle: string;
  knowsAbout: string[];
  url: string;
}): Record<string, unknown> {
  const person: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: PERSON_NAME,
    alternateName: [...PERSON_ALTERNATE_NAMES],
    jobTitle: input.jobTitle,
    url: input.url,
  };
  if (input.knowsAbout.length > 0) {
    person['knowsAbout'] = input.knowsAbout;
  }
  return person;
}

export function buildWebsiteJsonLd(input: { url: string; name: string }): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name,
    url: input.url,
  };
}

export function buildPersonWebsiteGraph(
  person: Record<string, unknown>,
  website: Record<string, unknown>,
): Record<string, unknown> {
  const { ['@context']: _personContext, ...personNode } = person;
  const { ['@context']: _websiteContext, ...websiteNode } = website;
  return {
    '@context': 'https://schema.org',
    '@graph': [personNode, websiteNode],
  };
}

export function buildCreativeWorkJsonLd(input: {
  name: string;
  url: string;
  description?: string;
  keywords?: string[];
}): Record<string, unknown> {
  const work: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: input.name,
    url: input.url,
  };
  const description = input.description?.trim();
  if (description) work['description'] = description;
  if (input.keywords && input.keywords.length > 0) work['keywords'] = input.keywords;
  return work;
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run src/app/shared/seo/json-ld.spec.ts`

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/seo/person-identity.ts src/app/shared/seo/json-ld.ts src/app/shared/seo/json-ld.spec.ts
git commit -m "feat(seo): add Person identity and JSON-LD builders"
```

---

### Task 2: Extend `PageMetaService` with JSON-LD lifecycle

**Files:**
- Modify: `src/app/shared/services/page-meta.service.ts`
- Create: `src/app/shared/services/page-meta.service.spec.ts`

**Interfaces:**
- Consumes: none from Task 1 directly (routes pass already-built objects)
- Produces: `PageMeta` gains optional `jsonLd?: Record<string, unknown>`; `apply` writes/replaces a single `<script type="application/ld+json" data-page-meta-jsonld>` in `<head>`; `restore` removes it if this service created/owned it for the route claim

- [ ] **Step 1: Write the failing tests**

Create `src/app/shared/services/page-meta.service.spec.ts` using TestBed + a real `document` from the testing platform (jsdom):

```typescript
import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { PageMetaService } from './page-meta.service';

describe('PageMetaService JSON-LD', () => {
  let service: PageMetaService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PageMetaService] });
    service = TestBed.inject(PageMetaService);
    document = TestBed.inject(DOCUMENT);
    document.head.innerHTML = '';
    document.title = 'Baseline';
  });

  it('writes title, description, canonical, and JSON-LD on apply', () => {
    service.apply({
      title: 'Robert Kameni Namou – Angular',
      description: 'Technical Lead Frontend Engineer',
      canonical: 'https://cv.lucastar.de/',
      jsonLd: { '@context': 'https://schema.org', '@type': 'Person', name: 'Robert Kameni Namou' },
    });
    expect(document.title).toBe('Robert Kameni Namou – Angular');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Technical Lead Frontend Engineer',
    );
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://cv.lucastar.de/');
    const script = document.head.querySelector('script[data-page-meta-jsonld]');
    expect(script?.textContent).toContain('Robert Kameni Namou');
  });

  it('removes JSON-LD on restore without leaving the route title', () => {
    service.apply({
      title: 'CV',
      description: 'Lebenslauf',
      canonical: 'https://cv.lucastar.de/cv',
      jsonLd: { '@type': 'Person' },
    });
    service.restore();
    expect(document.head.querySelector('script[data-page-meta-jsonld]')).toBeNull();
    expect(document.title).toBe('Baseline');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run src/app/shared/services/page-meta.service.spec.ts`

Expected: FAIL (`jsonLd` not on type / script not written).

- [ ] **Step 3: Implement JSON-LD on `PageMetaService`**

Extend the type and service (keep existing meta/canonical/lang behavior):

```typescript
export type PageMeta = {
  title: string;
  description: string;
  canonical: string;
  lang?: string;
  ogTitle?: string;
  ogDescription?: string;
  jsonLd?: Record<string, unknown>;
};
```

Add private field `private jsonLdOwned = false;`

In `apply`, after writing canonical:

```typescript
this.writeJsonLd(meta.jsonLd);
```

In `restore`, after clearing tags:

```typescript
this.clearJsonLd();
```

Helpers:

```typescript
private static readonly JSON_LD_ATTR = 'data-page-meta-jsonld';

private writeJsonLd(data: Record<string, unknown> | undefined): void {
  this.clearJsonLd();
  if (!data) return;
  const script = this.document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute(PageMetaService.JSON_LD_ATTR, '');
  script.textContent = JSON.stringify(data);
  this.document.head.appendChild(script);
  this.jsonLdOwned = true;
}

private clearJsonLd(): void {
  this.document.head.querySelectorAll(`script[${PageMetaService.JSON_LD_ATTR}]`).forEach((node) => node.remove());
  this.jsonLdOwned = false;
}
```

(If `jsonLdOwned` is unused after clear-always-on-restore, you may drop the flag — clearing by attribute is enough. Prefer attribute-only clear to avoid nested-stack bugs.)

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run src/app/shared/services/page-meta.service.spec.ts`

Expected: PASS. Also run `npm run test:ci` to ensure no regressions.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/services/page-meta.service.ts src/app/shared/services/page-meta.service.spec.ts
git commit -m "feat(seo): manage JSON-LD script lifecycle in PageMetaService"
```

---

### Task 3: DE/EN SEO copy templates

**Files:**
- Create: `src/app/shared/seo/page-seo-copy.ts`
- Create: `src/app/shared/seo/page-seo-copy.spec.ts`

**Interfaces:**
- Consumes: `AppLocale` from `src/app/shared/i18n/app-locale.ts`; `PERSON_NAME` from person-identity; spine strings aligned with `CV_DATA.headline`
- Produces:
  - `getPageSeoCopy(locale: AppLocale): { home: { title; description }; projects: { title; description }; cv: { title; description }; projectDetail: { title(projectTitle: string, technologies: string[]): string; description(projectTitle: string, technologies: string[]): string } }`
  - Home + CV titles/descriptions must include `Robert Kameni Namou` and Angular/Technical Lead signals
  - CV copy is German in both locales for the document itself (spec: CV stays DE) — `getPageSeoCopy('en').cv` may still be German strings because the Lebenslauf is German; home/projects follow locale

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, expect, it } from 'vitest';
import { PERSON_NAME } from './person-identity';
import { getPageSeoCopy } from './page-seo-copy';

describe('getPageSeoCopy', () => {
  it('puts the full name and Angular TL spine on home (de)', () => {
    const { home } = getPageSeoCopy('de');
    expect(home.title).toContain(PERSON_NAME);
    expect(home.title.toLowerCase()).toMatch(/angular|frontend/);
    expect(home.description).toContain(PERSON_NAME);
    expect(home.description).toMatch(/Angular/);
  });

  it('puts the full name and Angular TL spine on home (en)', () => {
    const { home } = getPageSeoCopy('en');
    expect(home.title).toContain(PERSON_NAME);
    expect(home.description).toMatch(/Angular/);
  });

  it('keeps CV title German with full name', () => {
    const { cv } = getPageSeoCopy('de');
    expect(cv.title).toContain('Lebenslauf');
    expect(cv.title).toContain(PERSON_NAME);
    expect(cv.description).toMatch(/Angular/);
  });

  it('builds project detail meta from title + technologies + spine', () => {
    const { projectDetail } = getPageSeoCopy('en');
    const title = projectDetail.title('Agent Ops', ['Next.js', 'TypeScript']);
    const description = projectDetail.description('Agent Ops', ['Next.js', 'TypeScript']);
    expect(title).toContain('Agent Ops');
    expect(description).toMatch(/Angular|TypeScript|Next\.js/);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/app/shared/seo/page-seo-copy.spec.ts`

- [ ] **Step 3: Implement templates**

`src/app/shared/seo/page-seo-copy.ts` — keep strings short, natural, no alternateName stuffing:

```typescript
import type { AppLocale } from '../i18n/app-locale';
import { PERSON_NAME } from './person-identity';

const SPINE_DE = 'Technical Lead Frontend Engineer (Angular, TypeScript, RxJS/NgRx; Next.js/React)';
const SPINE_EN = 'Technical Lead Frontend Engineer — Angular, TypeScript, RxJS/NgRx; Next.js/React';

export function getPageSeoCopy(locale: AppLocale) {
  const isDe = locale === 'de';
  return {
    home: {
      title: isDe
        ? `${PERSON_NAME} – Technical Lead Frontend (Angular)`
        : `${PERSON_NAME} – Technical Lead Frontend Engineer (Angular)`,
      description: isDe
        ? `Portfolio von ${PERSON_NAME}: ${SPINE_DE}. Projekte, Erfahrung und Kontakt.`
        : `Portfolio of ${PERSON_NAME}: ${SPINE_EN}. Selected projects, experience, and contact.`,
    },
    projects: {
      title: isDe
        ? `Projekte – ${PERSON_NAME} (Angular & Full-Stack Cases)`
        : `Projects – ${PERSON_NAME} (Angular & full-stack cases)`,
      description: isDe
        ? `Fallstudien von ${PERSON_NAME}: Enterprise-Angular, TypeScript und ausgewählte Next.js/React-Projekte.`
        : `Case studies by ${PERSON_NAME}: enterprise Angular, TypeScript, and selected Next.js/React work.`,
    },
    // Lebenslauf is always German for ATS/print.
    cv: {
      title: `Lebenslauf ${PERSON_NAME} – Technical Lead Frontend Engineer`,
      description: `Lebenslauf von ${PERSON_NAME}: Technical Lead Frontend Engineer mit Schwerpunkt Angular, TypeScript, RxJS/NgRx sowie Next.js/React.`,
    },
    projectDetail: {
      title(projectTitle: string, technologies: string[]): string {
        const tech = technologies.filter(Boolean).slice(0, 4).join(', ');
        const suffix = tech ? ` (${tech})` : ' (Angular / TypeScript)';
        return isDe
          ? `${projectTitle}${suffix} – Fallstudie, ${PERSON_NAME}`
          : `${projectTitle}${suffix} – Case study, ${PERSON_NAME}`;
      },
      description(projectTitle: string, technologies: string[]): string {
        const tech = technologies.filter(Boolean).join(', ');
        const techClause = tech ? tech : 'Angular, TypeScript';
        return isDe
          ? `${projectTitle} von ${PERSON_NAME}: ${techClause}. Teil des Portfolios als Technical Lead Frontend Engineer.`
          : `${projectTitle} by ${PERSON_NAME}: ${techClause}. From the portfolio of a Technical Lead Frontend Engineer.`;
      },
    },
  };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/app/shared/seo/page-seo-copy.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/seo/page-seo-copy.ts src/app/shared/seo/page-seo-copy.spec.ts
git commit -m "feat(seo): add bilingual page meta templates with name and stack spine"
```

---

### Task 4: Wire home + CV routes

**Files:**
- Modify: `src/app/pages/index.page.ts`
- Modify: `src/app/pages/cv/index.page.ts`
- Optionally add focused specs only if an existing page-spec pattern is cheap; otherwise rely on Task 1–3 unit tests + manual SSR check in Task 5

**Interfaces:**
- Consumes: `PageMetaService`, `getPageSeoCopy`, `buildPersonJsonLd`, `buildWebsiteJsonLd`, `buildPersonWebsiteGraph`, `CV_DATA` (for jobTitle / knowsAbout), `absoluteUrl` — **client bundle note:** `absoluteUrl` lives under `src/server/utils/site-url.ts`. Do **not** import server utils into browser pages. Instead add a tiny shared helper:

Create `src/app/shared/seo/site-absolute-url.ts`:

```typescript
const DEFAULT_ORIGIN = 'https://cv.lucastar.de';

/** Browser-safe canonical base; mirrors server default origin (no env injection in the client). */
export function siteAbsoluteUrl(path: string, origin = DEFAULT_ORIGIN): string {
  if (!path || path === '/') return `${origin}/`;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${suffix}`;
}
```

Use this from pages. Server sitemap keeps using `src/server/utils/site-url.ts`.

KnowsAbout extraction from CV (inline in page or small helper in `json-ld.ts`):

```typescript
function cvKnowsAbout(): string[] {
  return CV_DATA.skills.flatMap((group) =>
    group.items
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  ).slice(0, 12);
}
```

Prefer putting `cvKnowsAbout` in `src/app/shared/seo/cv-knows-about.ts` if it keeps the page thin.

- [ ] **Step 1: Add `site-absolute-url.ts` + unit test**

Test: `siteAbsoluteUrl('/') === 'https://cv.lucastar.de/'`, `siteAbsoluteUrl('/cv') === 'https://cv.lucastar.de/cv'`.

- [ ] **Step 2: Wire CV page**

In `cv/index.page.ts` constructor, replace hardcoded strings:

```typescript
const seo = getPageSeoCopy('de'); // document language fixed
this.pageMeta.apply({
  title: seo.cv.title,
  description: seo.cv.description,
  canonical: siteAbsoluteUrl('/cv'),
  lang: 'de',
  jsonLd: buildPersonJsonLd({
    jobTitle: CV_DATA.headline,
    knowsAbout: cvKnowsAbout(),
    url: siteAbsoluteUrl('/cv'),
  }),
});
```

Keep `destroyRef.onDestroy(() => this.pageMeta.restore())`.

- [ ] **Step 3: Wire home page**

In `index.page.ts`, inject `PageMetaService`, `LocaleService`, `DestroyRef`. On construct (and when locale changes), apply home meta:

```typescript
private readonly pageMeta = inject(PageMetaService);
private readonly localeService = inject(LocaleService);
private readonly destroyRef = inject(DestroyRef);

constructor() {
  // Re-apply when locale switches so EN/DE titles stay correct.
  const sync = () => {
    const seo = getPageSeoCopy(this.localeService.locale());
    const url = siteAbsoluteUrl('/');
    this.pageMeta.apply({
      title: seo.home.title,
      description: seo.home.description,
      canonical: url,
      jsonLd: buildPersonWebsiteGraph(
        buildPersonJsonLd({
          jobTitle: CV_DATA.headline,
          knowsAbout: cvKnowsAbout(),
          url,
        }),
        buildWebsiteJsonLd({ url, name: PERSON_NAME }),
      ),
    });
  };
  sync();
  // Use an effect OR subscribe to locale — prefer effect in injection context:
  // effect(() => { this.localeService.locale(); sync(); }) carefully to avoid double-apply loops.
  this.destroyRef.onDestroy(() => this.pageMeta.restore());
}
```

**Important:** Today `PageMetaService.save()` only captures the baseline once. If home calls `apply` again on locale change without `restore`, the second `apply` will not re-save (early return in `save`). That is OK — restore still returns to the original baseline. Call `apply` again on locale change with new strings; do **not** call `restore` between locale switches on the same route.

Simplest locale sync that matches existing patterns: read locale in constructor via `LocaleService`, and also use `effect(() => { const locale = this.localeService.locale(); … apply …})` inside the constructor injection context. First effect run + explicit sync may double-apply — use **only** the effect, not both.

```typescript
constructor() {
  effect(() => {
    const locale = this.localeService.locale();
    const seo = getPageSeoCopy(locale);
    const url = siteAbsoluteUrl('/');
    this.pageMeta.apply({
      title: seo.home.title,
      description: seo.home.description,
      canonical: url,
      jsonLd: buildPersonWebsiteGraph(
        buildPersonJsonLd({
          jobTitle: CV_DATA.headline,
          knowsAbout: cvKnowsAbout(),
          url,
        }),
        buildWebsiteJsonLd({ url, name: PERSON_NAME }),
      ),
    });
  });
  this.destroyRef.onDestroy(() => this.pageMeta.restore());
}
```

Import `effect` from `@angular/core`. Import `CV_DATA` from the CV data module (acceptable shared content dependency for SEO spine).

- [ ] **Step 4: Run unit tests**

Run: `npm run test:ci`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/seo/site-absolute-url.ts src/app/shared/seo/site-absolute-url.spec.ts src/app/shared/seo/cv-knows-about.ts src/app/pages/index.page.ts src/app/pages/cv/index.page.ts
git commit -m "feat(seo): apply name and stack meta JSON-LD on home and CV"
```

---

### Task 5: Wire projects list + project detail

**Files:**
- Modify: `src/app/pages/projects/index.page.ts`
- Modify: `src/app/pages/projects/[slug]/index.page.ts`

**Interfaces:**
- Consumes: same SEO helpers as Task 4
- Project detail: when `project()` is available, `technologies` = `project.tags` (string array). If tags empty, pass `[]` and let templates fall back to Angular/TypeScript wording; CreativeWork omits keywords.

- [ ] **Step 1: Projects list page**

Inject `PageMetaService`, `DestroyRef`. Use `effect` on `localeService.locale()`:

```typescript
effect(() => {
  const seo = getPageSeoCopy(this.localeService.locale());
  this.pageMeta.apply({
    title: seo.projects.title,
    description: seo.projects.description,
    canonical: siteAbsoluteUrl('/projects'),
  });
});
this.destroyRef.onDestroy(() => this.pageMeta.restore());
```

No JSON-LD required on the list page for Phase A (Person lives on home/CV).

- [ ] **Step 2: Project detail page**

After project data resolves, apply meta. Because slug reuse already uses signals, use an `effect` that reads `this.project()` (or whatever computed exposes the loaded project — today the template uses `projectResource.value()`; expose a `protected readonly project = computed(() => this.projectResource.value()?.data ?? null)` if missing):

```typescript
effect(() => {
  const locale = this.localeService.locale();
  const project = this.project();
  const seo = getPageSeoCopy(locale);
  if (!project) return;
  const tags = project.tags ?? [];
  const url = siteAbsoluteUrl(`/projects/${project.slug}`);
  this.pageMeta.apply({
    title: seo.projectDetail.title(project.title, tags),
    description: seo.projectDetail.description(project.title, tags),
    canonical: url,
    jsonLd: buildCreativeWorkJsonLd({
      name: project.title,
      url,
      description: project.description ?? undefined,
      keywords: tags,
    }),
  });
});
this.destroyRef.onDestroy(() => this.pageMeta.restore());
```

- [ ] **Step 3: ATS identity smoke (manual checklist in commit message / PR notes)**

Verify strings match (no code change unless drift found):

- `CV_DATA.name === 'Robert Kameni Namou'`
- `index.html` `<title>` / og tags already use full name (baseline; route meta overrides on navigation)
- If PDF/DOCX under `public/assets/cv/` still show an old short name, regenerate/fix in this same task commit

- [ ] **Step 4: Run tests**

Run: `npm run test:ci`

Expected: PASS.

Optional local SSR check: `npm run build` then inspect SSR HTML for `/cv` containing `application/ld+json` and `alternateName` if the project has a preview script — skip if no easy SSR HTML dump; unit tests cover builders/service.

- [ ] **Step 5: Commit**

```bash
git add src/app/pages/projects/index.page.ts src/app/pages/projects/[slug]/index.page.ts
# plus any ATS asset fixes if needed
git commit -m "feat(seo): apply meta and CreativeWork JSON-LD on project routes"
```

---

### Task 6 (Phase A follow-on): Crawl-stable `?lang=` + real hreflang

**Files:**
- Create: `src/app/shared/seo/hreflang.ts` (+ spec)
- Modify: `PageMetaService` to write/clear `link[rel=alternate][hreflang]`
- Modify: `LocaleService` or app bootstrap to honor `?lang=de|en` on first load (SSR + client)
- Modify: route meta callers to pass alternate URLs via `siteAbsoluteUrl(path) + '?lang=de'|'en'`

**Decision locked by this plan:** use query param `lang` (not path prefixes) to avoid router restructure.

**Interfaces:**
- Produces: `buildHreflangLinks(path: string): { lang: 'de' | 'en' | 'x-default'; href: string }[]` where `x-default` → `?lang=en` (international default) or site preference `de` — **use `x-default` → German CV-market default `?lang=de`** because primary market is DACH with bilingual support.
- `PageMeta` gains optional `hreflang?: { lang: string; href: string }[]`
- Fake same-URL pairs remain forbidden; every href must include the `lang` query

- [ ] **Step 1: Failing tests for `buildHreflangLinks`**

Assert `/cv` yields three hrefs containing `lang=de`, `lang=en`, and `x-default` pointing at `lang=de`.

- [ ] **Step 2: Implement helper + PageMetaService alternate links (apply/restore)**

- [ ] **Step 3: Honor `?lang=` in `LocaleService.initialLocale()`** (query wins over Accept-Language when present and valid)

- [ ] **Step 4: Pass hreflang from home, CV, projects list, project detail**

- [ ] **Step 5: `npm run test:ci` + commit**

```bash
git commit -m "feat(seo): add ?lang alternates and hreflang link tags"
```

---

### Task 7: Phase C stub (documentation only — do not implement in this plan run)

When executing this plan, **stop after Task 6** (or after Task 5 if follow-on is deferred). Phase C is specified in the design doc:

- Enrich project markdown with real stack narrative
- Richer CreativeWork fields
- No skill landing pages

Track Phase C as a future plan; do not expand scope here.

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| Stack-keyword meta on public routes | 3, 4, 5 |
| Name variants via `alternateName` | 1, 4 |
| Full name in home/CV titles | 3, 4 |
| Extend PageMetaService + JSON-LD | 2 |
| Person + WebSite / CreativeWork | 1, 4, 5 |
| CV lang `de` + ATS alignment | 4, 5 step 3 |
| No fake hreflang | 2–5 omit; 6 real only |
| `?lang` alternates | 6 |
| Phase C deepen projects | 7 (deferred) |
| No skill landings | Global constraint |

## Placeholder scan

No TBD/TODO left in task steps. Locale default for `x-default` fixed to `de`.
