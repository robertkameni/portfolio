# Dossier Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's black/green/Inter presentation with the Dossier system: cool paper, ink, one signal-orange accent, Instrument Sans plus JetBrains Mono, one section rhythm, six distinct layout families, and one 2px radius across every public surface and the admin.

**Architecture:** Design tokens live once in `src/styles.css` (`@theme` for colours and radii, `:root` for sizes, a `prefers-color-scheme: dark` block for the dark set) plus seven `.type-*` component classes and a `.page-shell` layout primitive. Every template consumes tokens and those classes rather than hex values or one-off type utilities. The two "hero card" components collapse into one `masthead` and one `focus-areas` component so the page has six real layout families instead of five bordered boxes.

**Tech Stack:** Angular 22 standalone components with signal inputs, Analog/Vite, Tailwind CSS v4 (`@theme` tokens, no `dark:` variants), Vitest + jsdom, `@fontsource-variable/instrument-sans`, `@fontsource-variable/jetbrains-mono`.

## Global Constraints

- No `#000000` and no `#ffffff` anywhere in `src/**/*.css` or `src/app/**/*.html`.
- No hardcoded hex colour in any template. Use `bg-paper`, `bg-paper-2`, `bg-surface`, `text-ink`, `text-ink-2`, `text-ink-3`, `border-rule`, `bg-accent`, `text-accent`, `bg-accent-wash`.
- No `Inter`, no `Fira Code`, no Google Fonts `<link>`.
- One border radius: `rounded-base` (2px). `rounded-full` is allowed only on the portrait ring and the chat avatar.
- Exactly one eyebrow on the homepage (`stack.eyebrow`).
- No em-dash characters in any rendered string.
- Every text/background pair at or above 4.5:1 contrast.
- `trackBehavior` values are analytics contracts. Keep the existing strings exactly: `intro_viewed`, `hero_viewed`, `hero_card_viewed_{{title}}`, `skills_viewed`, `skill_viewed_{{name}}`, `about_viewed`, `project_viewed_{{slug}}`, `contact_viewed`.
- Every animation honours `prefers-reduced-motion: reduce`.
- Form field `name` attributes and `id` values defined here are contract: `contact-name`, `contact-email`, `contact-message`.
- Node 20.19.1 or later, as pinned in `package.json`.

---

### Task 1: Design tokens, fonts and base layer

**Files:**
- Modify: `src/styles.css` (full rewrite)
- Modify: `index.html` (boot loader colours and font family)
- Test: `src/design-system.spec.ts` (create)
- Modify: `package.json` (two dependencies)

**Interfaces:**
- Produces: CSS custom properties `--color-paper`, `--color-paper-2`, `--color-surface`, `--color-ink`, `--color-ink-2`, `--color-ink-3`, `--color-rule`, `--color-accent`, `--color-accent-wash`, `--radius-base`, `--ease-out`, `--dur-fast`, `--dur-base`, `--dur-reveal`, `--reveal-distance`, `--text-display`, `--text-lead`, `--text-h2`, `--text-h3`, `--text-body`, `--text-small`, `--text-meta`, `--text-metric`, `--container`, `--gutter`.
- Produces: classes `.page-shell`, `.type-display`, `.type-lead`, `.type-h2`, `.type-h3`, `.type-meta`, `.type-metric`, `.reveal`.
- Produces: Tailwind utilities `bg-paper`, `bg-paper-2`, `bg-surface`, `text-ink`, `text-ink-2`, `text-ink-3`, `border-rule`, `bg-accent`, `text-accent`, `bg-accent-wash`, `rounded-base`.
- Preserves: `bg-background`, `text-primary`, `bg-primary`, `border-primary` keep working through alias tokens so untouched templates do not break mid-migration.

- [ ] **Step 1: Install the fonts**

```bash
npm install @fontsource-variable/instrument-sans @fontsource-variable/jetbrains-mono
```

- [ ] **Step 2: Write the failing token test**

Create `src/design-system.spec.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

describe('design tokens', () => {
  it('defines the Dossier palette', () => {
    expect(css).toContain('--color-paper: #f1f2f2');
    expect(css).toContain('--color-surface: #fafafa');
    expect(css).toContain('--color-ink: #101113');
    expect(css).toContain('--color-ink-2: #4c5054');
    expect(css).toContain('--color-ink-3: #63686d');
    expect(css).toContain('--color-rule: #d6d8d9');
    expect(css).toContain('--color-accent: #c0430f');
  });

  it('defines the dark scheme override', () => {
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('--color-paper: #141516');
    expect(css).toContain('--color-accent: #ff8350');
  });

  it('does not use Inter or pure black', () => {
    expect(css).not.toMatch(/Inter/);
    expect(css).not.toContain('#000000');
    expect(css).not.toMatch(/#000\b/);
  });

  it('defines the type and layout primitives', () => {
    for (const token of ['--text-display', '--text-lead', '--text-h2', '--text-meta', '--text-metric', '--container', '--gutter']) {
      expect(css).toContain(token);
    }
    for (const cls of ['.page-shell', '.type-display', '.type-h2', '.type-meta', '.type-metric', '.reveal']) {
      expect(css).toContain(cls);
    }
  });

  it('declares a single border radius scale', () => {
    expect(css).toContain('--radius-base: 2px');
  });
});
```

- [ ] **Step 3: Run the test to watch it fail**

Run: `npx vitest run src/design-system.spec.ts`
Expected: FAIL, the current `styles.css` has `#000000`, defines `Inter`, and has no `--color-paper`.

- [ ] **Step 4: Rewrite `src/styles.css`**

```css
@import '@fontsource-variable/instrument-sans';
@import '@fontsource-variable/jetbrains-mono';
@import 'tailwindcss';

@theme {
  --font-sans: 'Instrument Sans Variable', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, monospace;

  --color-paper: #f1f2f2;
  --color-paper-2: #e9eaea;
  --color-surface: #fafafa;
  --color-ink: #101113;
  --color-ink-2: #4c5054;
  --color-ink-3: #63686d;
  --color-rule: #d6d8d9;
  --color-accent: #c0430f;
  --color-accent-wash: #f7e9e2;

  /* Aliases kept so templates that are not migrated yet still resolve. */
  --color-background: #f1f2f2;
  --color-primary: #c0430f;

  --radius-base: 2px;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 150ms;
  --dur-base: 220ms;
  --dur-reveal: 600ms;
  --reveal-distance: 12px;
}

:root {
  --text-display: clamp(2.75rem, 1.35rem + 6.2vw, 6rem);
  --text-lead: clamp(1.125rem, 1rem + 0.7vw, 1.5rem);
  --text-h2: clamp(1.6rem, 1.2rem + 1.7vw, 2.5rem);
  --text-h3: 1.0625rem;
  --text-body: 1rem;
  --text-small: 0.875rem;
  --text-meta: 0.75rem;
  --text-metric: clamp(2rem, 1.4rem + 2.4vw, 3.5rem);
  --container: 78rem;
  --gutter: 1.5rem;
}

@media (min-width: 768px) {
  :root {
    --gutter: 2.5rem;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-paper: #141516;
    --color-paper-2: #101112;
    --color-surface: #1b1d1e;
    --color-ink: #eceded;
    --color-ink-2: #a8adb0;
    --color-ink-3: #858a8d;
    --color-rule: #2c2f31;
    --color-accent: #ff8350;
    --color-accent-wash: #2a1a13;
    --color-background: #141516;
    --color-primary: #ff8350;
  }
}

@layer base {
  html {
    background: var(--color-paper);
  }

  body {
    margin: 0;
    background: var(--color-paper);
    color: var(--color-ink-2);
    font-family: var(--font-sans);
    font-size: var(--text-body);
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }

  ::selection {
    background: var(--color-accent);
    color: var(--color-paper);
  }

  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  h1,
  h2,
  h3 {
    color: var(--color-ink);
    text-wrap: balance;
  }

  p {
    text-wrap: pretty;
  }

  img {
    display: block;
  }
}

@layer components {
  .page-shell {
    width: 100%;
    max-width: var(--container);
    margin-inline: auto;
    padding-inline: var(--gutter);
  }

  .type-display {
    font-size: var(--text-display);
    line-height: 0.95;
    font-weight: 600;
    letter-spacing: -0.03em;
    color: var(--color-ink);
  }

  .type-lead {
    font-size: var(--text-lead);
    line-height: 1.4;
    font-weight: 500;
    letter-spacing: -0.01em;
  }

  .type-h2 {
    font-size: var(--text-h2);
    line-height: 1.1;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--color-ink);
  }

  .type-h3 {
    font-size: var(--text-h3);
    line-height: 1.4;
    font-weight: 600;
    color: var(--color-ink);
  }

  .type-meta {
    font-family: var(--font-mono);
    font-size: var(--text-meta);
    line-height: 1.4;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .type-metric {
    font-size: var(--text-metric);
    line-height: 1;
    font-weight: 600;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
  }

  .reveal {
    opacity: 0;
    transform: translateY(var(--reveal-distance));
    transition:
      opacity var(--dur-reveal) var(--ease-out),
      transform var(--dur-reveal) var(--ease-out);
    transition-delay: var(--reveal-delay, 0ms);
  }

  .reveal[data-visible='true'] {
    opacity: 1;
    transform: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
}
```

- [ ] **Step 5: Restyle the boot loader in `index.html`**

Replace the whole `<style>` block and update the description meta tag (it currently contains an em-dash):

```html
<meta
  name="description"
  content="Portfolio of Robert Kameni: Technical Lead and frontend engineer (Angular, full stack). Selected projects, experience, and contact."
/>
<style>
  html,
  body {
    height: 100%;
  }

  body {
    background: #f1f2f2;
    color: #101113;
    margin: 0;
    padding: 0;
    font-family: 'Instrument Sans Variable', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  a {
    color: inherit;
  }

  #boot-loader {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f2f2;
  }

  #boot-loader .shell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    text-align: center;
  }

  #boot-loader .bar {
    width: 6rem;
    height: 1px;
    background: #d6d8d9;
    overflow: hidden;
  }

  #boot-loader .bar::after {
    content: '';
    display: block;
    width: 40%;
    height: 1px;
    background: #c0430f;
    animation: sweep 1.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  }

  #boot-loader .title {
    font: 500 11px/1.4 'JetBrains Mono Variable', ui-monospace, monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #63686d;
  }

  @keyframes sweep {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(300%);
    }
  }

  @media (prefers-color-scheme: dark) {
    body,
    #boot-loader {
      background: #141516;
      color: #eceded;
    }
    #boot-loader .bar {
      background: #2c2f31;
    }
    #boot-loader .bar::after {
      background: #ff8350;
    }
    #boot-loader .title {
      color: #858a8d;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    #boot-loader .bar::after {
      animation: none;
      width: 100%;
    }
  }
</style>
```

Update the loader markup to use the new bar:

```html
<div id="boot-loader" aria-hidden="true">
  <div class="shell">
    <div class="bar"></div>
    <div class="title">Loading portfolio</div>
  </div>
</div>
```

The hex values inside `index.html` are permitted: this block renders before any CSS bundle loads, so it cannot use custom properties.

- [ ] **Step 6: Run the token test**

Run: `npx vitest run src/design-system.spec.ts`
Expected: PASS, 5 tests.

- [ ] **Step 7: Verify the build compiles with the fonts**

Run: `npm run build`
Expected: build succeeds, and `dist/client` contains Instrument Sans woff2 assets.

- [ ] **Step 8: Commit**

```bash
git add src/styles.css src/design-system.spec.ts index.html package.json package-lock.json
git commit -m "feat(design): add Dossier tokens, fonts and base layer"
```

---

### Task 2: Rewrite the reveal directive

**Files:**
- Modify: `src/app/shared/directives/fade-in.directive.ts`
- Test: `src/app/shared/directives/fade-in.directive.spec.ts` (create)

**Interfaces:**
- Consumes: `.reveal` and `[data-visible]` from Task 1.
- Produces: `FadeInDirective`, selector `[fadeIn]`, unchanged public surface. Same directive, new behaviour.

- [ ] **Step 1: Write the failing test**

```ts
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FadeInDirective } from './fade-in.directive';

@Component({
  standalone: true,
  imports: [FadeInDirective],
  template: '<div fadeIn data-testid="box">content</div>',
})
class HostComponent {}

describe('FadeInDirective', () => {
  let trigger: IntersectionObserverCallback;

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          trigger = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
        root = null;
        rootMargin = '';
        thresholds = [];
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function render() {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('[data-testid="box"]') as HTMLElement;
  }

  it('hides the element until it intersects', () => {
    const box = render();
    expect(box.classList.contains('reveal')).toBe(true);
    expect(box.dataset['visible']).toBeUndefined();
  });

  it('reveals the element on intersection', () => {
    const box = render();
    trigger([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(box.dataset['visible']).toBe('true');
  });

  it('does not hide anything when the user prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const box = render();
    expect(box.classList.contains('reveal')).toBe(false);
    expect(box.dataset['visible']).toBe('true');
  });
});
```

- [ ] **Step 2: Run the test to watch it fail**

Run: `npx vitest run src/app/shared/directives/fade-in.directive.spec.ts`
Expected: FAIL. The current directive sets inline `opacity` and never writes `data-visible`.

- [ ] **Step 3: Implement the directive**

```ts
import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';

@Directive({
  selector: '[fadeIn]',
  standalone: true,
})
export class FadeInDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const node = this.el.nativeElement;

    if (this.prefersReducedMotion()) {
      node.dataset['visible'] = 'true';
      return;
    }

    node.classList.add('reveal');

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.reveal();
        }
      },
      { threshold: 0.12 },
    );

    this.observer.observe(node);

    if (this.isInViewport(node)) {
      requestAnimationFrame(() => requestAnimationFrame(() => this.reveal()));
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private reveal(): void {
    this.el.nativeElement.dataset['visible'] = 'true';
    this.observer?.disconnect();
    this.observer = null;
  }

  private prefersReducedMotion(): boolean {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private isInViewport(node: HTMLElement): boolean {
    const rect = node.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }
}
```

- [ ] **Step 4: Run the test to watch it pass**

Run: `npx vitest run src/app/shared/directives/fade-in.directive.spec.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/directives/fade-in.directive.ts src/app/shared/directives/fade-in.directive.spec.ts
git commit -m "refactor(motion): drive reveals through tokens and honour reduced motion"
```

---

### Task 3: Add the new copy keys

**Files:**
- Modify: `src/app/shared/i18n/site-copy.types.ts`
- Modify: `src/app/shared/i18n/en.ts`
- Modify: `src/app/shared/i18n/de.ts`

**Interfaces:**
- Produces: `SiteCopy['focus']['title']`, `SiteCopy['stack']['eyebrow']`, `SiteCopy['about']['metric']`, `SiteCopy['projects']['unavailable']`, `SiteCopy['contact']['nameLabel' | 'emailLabel' | 'messageLabel' | 'sendLabel' | 'sendingLabel']`, `SiteCopy['chat']['launcherLabel']`, `SiteCopy['footer']['copyright']`.

- [ ] **Step 1: Extend the type**

Add these members to `SiteCopy` in `site-copy.types.ts`. Insert `focus` and `stack` after `intro`; add the rest to their existing blocks:

```ts
  focus: {
    title: string;
  };
  stack: {
    eyebrow: string;
  };
```

Inside `about`, add:

```ts
    metric: {
      value: string;
      caption: string;
    };
```

Inside `projects`, add:

```ts
    unavailable: string;
```

Inside `contact`, add:

```ts
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    sendLabel: string;
    sendingLabel: string;
```

Inside `chat`, add:

```ts
    launcherLabel: string;
```

Add a new top-level block before `common`:

```ts
  footer: {
    /** Use `{year}` for the current year. */
    copyright: string;
  };
```

- [ ] **Step 2: Add the English values**

In `en.ts`, merge:

```ts
  focus: { title: 'What I do' },
  stack: { eyebrow: 'Toolset' },
```

```ts
  about: {
    // ...existing keys
    metric: { value: '50%', caption: 'faster team delivery at DATEV' },
  },
```

```ts
  projects: {
    // ...existing keys
    unavailable: 'Case write-ups are in progress.',
  },
```

```ts
  contact: {
    // ...existing keys
    nameLabel: 'Name',
    emailLabel: 'Email',
    messageLabel: 'Message',
    sendLabel: 'Send message',
    sendingLabel: 'Sending',
  },
```

```ts
  chat: {
    // ...existing keys
    launcherLabel: 'Ask the twin',
  },
```

```ts
  footer: { copyright: '© {year} Robert Kameni' },
```

- [ ] **Step 3: Add the German values**

In `de.ts`, merge:

```ts
  focus: { title: 'Schwerpunkt' },
  stack: { eyebrow: 'Werkzeuge' },
```

```ts
  about: {
    // ...existing keys
    metric: { value: '50%', caption: 'schnellere Team-Lieferung bei der DATEV' },
  },
```

```ts
  projects: {
    // ...existing keys
    unavailable: 'Projektbeschreibungen folgen in Kürze.',
  },
```

```ts
  contact: {
    // ...existing keys
    nameLabel: 'Name',
    emailLabel: 'E-Mail',
    messageLabel: 'Nachricht',
    sendLabel: 'Nachricht senden',
    sendingLabel: 'Wird gesendet',
  },
```

```ts
  chat: {
    // ...existing keys
    launcherLabel: 'Frag den Twin',
  },
```

```ts
  footer: { copyright: '© {year} Robert Kameni' },
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS. Both locale objects satisfy `SiteCopy`, so a missing key fails here.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/i18n/site-copy.types.ts src/app/shared/i18n/en.ts src/app/shared/i18n/de.ts
git commit -m "feat(i18n): add copy keys for the Dossier redesign"
```

---

### Task 4: Masthead component

**Files:**
- Create: `src/app/pages/components/masthead/masthead.ts`
- Create: `src/app/pages/components/masthead/masthead.html`
- Create: `src/app/pages/components/masthead/interface/intro-data.ts`
- Create: `src/app/pages/components/masthead/interface/social-link.ts`
- Test: `src/app/pages/components/masthead/masthead.spec.ts`

**Interfaces:**
- Consumes: `.page-shell`, `.type-display`, `.type-lead`, `.type-meta` from Task 1.
- Produces: `<masthead [data]="IntroData" [locale]="AppLocale" />`. Selector `masthead`. Replaces `intro` and `hero` as the page's `h1`.

- [ ] **Step 1: Move the interfaces**

Create `src/app/pages/components/masthead/interface/social-link.ts`:

```ts
export interface SocialLink {
  platform: string;
  url: string;
  iconPath: string;
}
```

Create `src/app/pages/components/masthead/interface/intro-data.ts`:

```ts
import { SocialLink } from './social-link';

export interface IntroData {
  name: string;
  title: string;
  description: string;
  socials: SocialLink[];
}
```

- [ ] **Step 2: Write the failing test**

```ts
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Masthead } from './masthead';
import { VisitorStore } from '../../../store/visitor.store';
import type { IntroData } from './interface/intro-data';

const data: IntroData = {
  name: 'Robert Kameni',
  title: 'Technical Lead Frontend Specialist',
  description: 'Scalable Angular platforms and the architecture behind them.',
  socials: [
    { platform: 'LinkedIn', url: 'https://example.com/li', iconPath: 'M0 0' },
    { platform: 'Xing', url: 'https://example.com/xing', iconPath: 'M0 0' },
  ],
};

describe('Masthead', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Masthead],
      providers: [provideZonelessChangeDetection(), { provide: VisitorStore, useValue: { profile: () => null } }],
    });
  });

  it('renders the name as the page h1 and never splits it into letters', () => {
    const fixture = TestBed.createComponent(Masthead);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent?.trim()).toBe('Robert Kameni');
    expect(h1.querySelectorAll('span').length).toBe(0);
  });

  it('renders one text link per social platform', () => {
    const fixture = TestBed.createComponent(Masthead);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    const links = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];
    expect(links.map((a) => a.textContent?.trim())).toEqual(['LinkedIn', 'Xing']);
    expect(fixture.nativeElement.querySelector('a svg')).toBeNull();
  });

  it('falls back to the profile title when there is no visitor profile', () => {
    const fixture = TestBed.createComponent(Masthead);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Technical Lead Frontend Specialist');
  });
});
```

- [ ] **Step 3: Run the test to watch it fail**

Run: `npx vitest run src/app/pages/components/masthead/masthead.spec.ts`
Expected: FAIL, `Cannot find module './masthead'`.

- [ ] **Step 4: Implement `masthead.ts`**

```ts
import { Component, computed, inject, input } from '@angular/core';
import { TrackBehaviorDirective } from '../../../ai-engine';
import { VisitorStore } from '../../../store/visitor.store';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import type { IntroData } from './interface/intro-data';

@Component({
  selector: 'masthead',
  standalone: true,
  imports: [TrackBehaviorDirective],
  templateUrl: './masthead.html',
})
export class Masthead {
  private readonly visitorStore = inject(VisitorStore);

  data = input.required<IntroData>();
  locale = input<AppLocale>('en');

  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  readonly name = computed(() => this.data()?.name ?? '');
  readonly description = computed(() => this.data()?.description ?? '');

  readonly socials = computed(() => {
    const list = this.data()?.socials;
    if (!Array.isArray(list)) return [];
    return list.filter((social) => !!social?.platform && !!social?.url);
  });

  readonly role = computed(() => {
    const profile = this.visitorStore.profile();
    const fallback = this.data()?.title || this.copy().hero.defaultTitle;

    if (!profile) return fallback;

    switch (profile.visitorType) {
      case 'recruiter':
      case 'hiring_manager':
        return this.copy().hero.adaptiveTitle.recruiter;
      case 'founder':
        return this.copy().hero.adaptiveTitle.founder;
      case 'developer':
        return this.copy().hero.adaptiveTitle.developer;
      default:
        return fallback;
    }
  });

  socialAriaLabel(platform: string): string {
    return this.copy().intro.socialLinkAriaLabel.replaceAll('{platform}', platform);
  }
}
```

- [ ] **Step 5: Write `masthead.html`**

```html
<section trackBehavior="intro_viewed" class="pb-20 pt-16 md:pb-24 md:pt-20">
  <div class="page-shell">
    <div class="grid grid-cols-1 gap-10 md:grid-cols-[7fr_4fr] md:items-end md:gap-16">
      <div class="min-w-0">
        <h1 class="type-display">{{ name() }}</h1>

        <p class="type-lead mt-6 max-w-[38ch] text-ink-2">{{ role() }}</p>

        <p class="mt-4 max-w-[46ch] text-ink-2">{{ description() }}</p>

        <ul class="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
          @for (social of socials(); track social.platform) {
          <li>
            <a
              [href]="social.url"
              target="_blank"
              rel="noopener noreferrer"
              [attr.aria-label]="socialAriaLabel(social.platform)"
              class="type-meta text-ink-3 underline decoration-transparent underline-offset-4 transition-colors duration-150 hover:text-accent hover:decoration-current"
            >
              {{ social.platform }}
            </a>
          </li>
          }
        </ul>
      </div>

      <div class="md:justify-self-end">
        <img
          src="/assets/lucas-600.jpg"
          srcset="/assets/lucas-400.jpg 400w, /assets/lucas-600.jpg 600w, /assets/lucas-800.jpg 800w"
          width="480"
          height="600"
          sizes="(min-width: 768px) 30vw, 80vw"
          alt="Robert Kameni"
          decoding="async"
          loading="lazy"
          class="aspect-[4/5] w-full max-w-[20rem] object-cover object-top grayscale transition-[filter] duration-500 hover:grayscale-0"
        />
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 6: Run the test to watch it pass**

Run: `npx vitest run src/app/pages/components/masthead/masthead.spec.ts`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add src/app/pages/components/masthead
git commit -m "feat(design): add masthead component"
```

---

### Task 5: Focus areas component

**Files:**
- Create: `src/app/pages/components/focus-areas/focus-areas.ts`
- Create: `src/app/pages/components/focus-areas/focus-areas.html`
- Create: `src/app/pages/components/focus-areas/interface/skill-card.ts`
- Test: `src/app/pages/components/focus-areas/focus-areas.spec.ts`

**Interfaces:**
- Consumes: `.type-h2`, `.type-h3`, `.type-meta` from Task 1.
- Produces: `<focus-areas [cards]="SkillCard[]" [locale]="AppLocale" />`. Selector `focus-areas`. Public `SkillCard` interface at `focus-areas/interface/skill-card.ts` with `title`, `subtitle`, `iconPath`, `description`, `items: { title: string; description: string }[]`.

- [ ] **Step 1: Create the interface**

```ts
export interface SkillCard {
  title: string;
  subtitle: string;
  iconPath: string;
  description: string;
  items: SkillItem[];
}

export interface SkillItem {
  title: string;
  description: string;
}
```

- [ ] **Step 2: Write the failing test**

```ts
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { FocusAreas } from './focus-areas';
import { VisitorStore } from '../../../store/visitor.store';
import type { SkillCard } from './interface/skill-card';

const cards: SkillCard[] = [
  {
    title: 'Frontend',
    subtitle: 'Angular | NextJS | RxJS | TypeScript',
    iconPath: 'M0 0',
    description: 'Reactive UI architecture.',
    items: [
      { title: 'Reactive UI:', description: 'Signals and Signal Store.' },
      { title: 'Testing:', description: 'Playwright and Jest.' },
    ],
  },
  {
    title: 'Backend & Quality',
    subtitle: 'Java 17 | Spring Boot 3',
    iconPath: 'M0 0',
    description: 'Typed APIs.',
    items: [{ title: 'APIs:', description: 'Nitro and Spring Boot.' }],
  },
];

describe('FocusAreas', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FocusAreas],
      providers: [provideZonelessChangeDetection(), { provide: VisitorStore, useValue: { profile: () => null } }],
    });
  });

  it('renders one article per card with no icons and no trailing colon in item titles', () => {
    const fixture = TestBed.createComponent(FocusAreas);
    fixture.componentRef.setInput('cards', cards);
    fixture.detectChanges();

    const articles = fixture.nativeElement.querySelectorAll('article');
    expect(articles.length).toBe(2);
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();

    const firstItemTitle = fixture.nativeElement.querySelector('article li h3') as HTMLElement;
    expect(firstItemTitle.textContent?.trim()).toBe('Reactive UI');
  });
});
```

- [ ] **Step 3: Run the test to watch it fail**

Run: `npx vitest run src/app/pages/components/focus-areas/focus-areas.spec.ts`
Expected: FAIL, `Cannot find module './focus-areas'`.

- [ ] **Step 4: Implement `focus-areas.ts`**

```ts
import { Component, computed, inject, input } from '@angular/core';
import { TrackBehaviorDirective } from '../../../ai-engine';
import { VisitorStore } from '../../../store/visitor.store';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import type { SkillCard } from './interface/skill-card';

@Component({
  selector: 'focus-areas',
  standalone: true,
  imports: [TrackBehaviorDirective],
  templateUrl: './focus-areas.html',
})
export class FocusAreas {
  private readonly visitorStore = inject(VisitorStore);

  cards = input.required<SkillCard[]>();
  locale = input<AppLocale>('en');

  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  readonly adaptiveCards = computed(() => {
    const profile = this.visitorStore.profile();
    const type = profile?.visitorType;
    const heroCopy = this.copy().hero;

    return (this.cards() ?? []).map((baseCard) => {
      const card = { ...baseCard };
      const lower = baseCard.title.toLowerCase();

      const pick = <T>(variants: { default: T; founder: T; recruiter: T; developer: T }): T => {
        if (type === 'founder') return variants.founder;
        if (type === 'recruiter' || type === 'hiring_manager') return variants.recruiter;
        if (type === 'developer') return variants.developer;
        return variants.default;
      };

      if (lower.includes('frontend')) {
        const chosen = pick(heroCopy.frontend);
        card.description = chosen.description;
        card.items = [...chosen.items];
      } else if (lower.includes('backend') || lower.includes('quality')) {
        const chosen = pick(heroCopy.backend);
        card.description = chosen.description;
        card.items = [...chosen.items];
      }

      card.items = card.items.map((item) => ({ ...item, title: item.title.replace(/:\s*$/, '') }));

      return card;
    });
  });
}
```

- [ ] **Step 5: Write `focus-areas.html`**

```html
<section trackBehavior="hero_viewed" class="border-t border-rule py-16">
  <div class="page-shell">
    <h2 class="type-h2">{{ copy().focus.title }}</h2>

    <div class="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-0 md:divide-x md:divide-rule">
      @for (card of adaptiveCards(); track card.title) {
      <article trackBehavior="hero_card_viewed_{{ card.title }}" class="md:px-10 md:first:pl-0 md:last:pr-0">
        <p class="type-meta text-ink-3">{{ card.title }}</p>
        <p class="mt-2 font-mono text-[0.8125rem] text-ink-3">{{ card.subtitle }}</p>
        <p class="mt-4 max-w-[42ch] text-ink-2">{{ card.description }}</p>

        <ul class="mt-6 divide-y divide-rule border-t border-rule">
          @for (item of card.items; track item.title) {
          <li class="py-4">
            <h3 class="type-h3">{{ item.title }}</h3>
            <p class="mt-1 text-ink-2">{{ item.description }}</p>
          </li>
          }
        </ul>
      </article>
      }
    </div>
  </div>
</section>
```

Note: `text-ink-2` on `<p>` inherits the body size of 16px, which is the intended reading size. Do not add a smaller `text-sm` here.

- [ ] **Step 6: Run the test to watch it pass**

Run: `npx vitest run src/app/pages/components/focus-areas/focus-areas.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/pages/components/focus-areas
git commit -m "feat(design): add focus areas component"
```

---

### Task 6: Wire the homepage and remove the old hero components

**Files:**
- Modify: `src/app/pages/index.page.html` (full rewrite)
- Modify: `src/app/pages/index.page.ts`
- Delete: `src/app/pages/components/intro/**`
- Delete: `src/app/pages/components/hero/**`

**Interfaces:**
- Consumes: `Masthead` from Task 4, `FocusAreas` from Task 5, `trackBehavior` names from the Global Constraints.
- Produces: `Home.activeProfile` signal used by the toolbar content in this task.

- [ ] **Step 1: Rewrite `index.page.html`**

```html
<a
  href="#main"
  class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-base focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
>
  Skip to content
</a>

<site-toolbar>
  @if (devMode) {
  <button (click)="setMockProfile('founder')" [attr.aria-pressed]="activeProfile() === 'founder'" class="toolbar-option cursor-pointer">
    {{ copy().home.founder }}
  </button>
  <button (click)="setMockProfile('recruiter')" [attr.aria-pressed]="activeProfile() === 'recruiter'" class="toolbar-option cursor-pointer">
    {{ copy().home.recruiter }}
  </button>
  <button (click)="setMockProfile('developer')" [attr.aria-pressed]="activeProfile() === 'developer'" class="toolbar-option cursor-pointer">
    {{ copy().home.developer }}
  </button>
  <button (click)="setMockProfile(null)" [attr.aria-pressed]="activeProfile() === null" class="toolbar-option cursor-pointer">
    {{ copy().home.reset }}
  </button>
  }
</site-toolbar>

<main id="main" class="min-h-screen bg-paper">
  @if (store.isLoading()) {
  <page-loader [message]="copy().home.loadingProfile" />
  } @else if (store.error()) {
  <page-loader [message]="copy().home.failedProfile" />
  } @else if (store.data(); as profile) {
  <masthead [data]="profile.intro" [locale]="profile.locale" fadeIn />

  <focus-areas [cards]="profile.heroCards" [locale]="profile.locale" fadeIn />

  @defer (on idle) {
  <skills-bento [skills]="profile.skills" [locale]="profile.locale" fadeIn />
  } @placeholder (minimum 200ms) {
  <div class="h-24"></div>
  } @defer (on idle) {
  <about [data]="profile.about" [locale]="profile.locale" fadeIn />
  } @placeholder (minimum 200ms) {
  <div class="h-32"></div>
  } @defer (on idle) {
  <projects-section [locale]="profile.locale" fadeIn />
  } @placeholder (minimum 200ms) {
  <div class="h-32"></div>
  } @defer (on idle) {
  <contact [data]="profile.contact" [locale]="profile.locale" fadeIn />
  } @placeholder (minimum 200ms) {
  <div class="h-32"></div>
  } @defer (on idle) {
  <dev-footer fadeIn />
  } @placeholder (minimum 200ms) {
  <div class="h-16"></div>
  } }
</main>

@if (store.data()) { @defer (on interaction(chatLauncher)) {
<chat-widget />
} @placeholder {
<div class="fixed bottom-6 right-6 z-50">
  <button
    #chatLauncher
    type="button"
    (click)="openChatFromLauncher()"
    [attr.aria-label]="copy().chat.toggleOpenAriaLabel"
    class="type-meta inline-flex cursor-pointer items-center gap-2 rounded-base bg-ink px-4 py-3 text-paper transition-colors duration-150 hover:bg-accent"
  >
    {{ copy().chat.launcherLabel }}
    <span aria-hidden="true">&#8594;</span>
  </button>
</div>
} }
```

- [ ] **Step 2: Update `index.page.ts`**

Replace the imports and class body. Remove `AuthService`, `Router`, `onAdminClick`, `navigateToAdmin`, `logout` (they move to the toolbar in Task 13). Add `activeProfile`:

```ts
import { Component, computed, inject, isDevMode, OnInit } from '@angular/core';
import { withRenderMode } from '../shared/routing/render-mode.types';
import { PortfolioStore } from '../store/portfolio.store';
import { VisitorStore } from '../store/visitor.store';
import { ChatStore } from '../store/chat.store';
import { getSiteCopy } from '../shared/i18n/site-copy';
import { FadeInDirective } from '../shared/directives/fade-in.directive';
import { SiteToolbarComponent } from '../shared/components/site-toolbar/site-toolbar';
import { PageLoader } from '../shared/components/page-loader/page-loader';
import { Masthead } from './components/masthead/masthead';
import { FocusAreas } from './components/focus-areas/focus-areas';
import { SkillsBento } from './components/skills-bento/skills-bento';
import { About } from './components/about/about';
import { ProjectsSection } from './components/projects/projects-section';
import { Contact } from './components/contact/contact';
import { Footer } from './components/footer/footer';
import { ChatWidget } from '../ai-engine';

export const routeMeta = withRenderMode('server');

@Component({
  selector: 'home',
  standalone: true,
  imports: [
    Masthead,
    FocusAreas,
    SkillsBento,
    About,
    ProjectsSection,
    Contact,
    Footer,
    ChatWidget,
    PageLoader,
    FadeInDirective,
    SiteToolbarComponent,
  ],
  templateUrl: './index.page.html',
})
export default class Home implements OnInit {
  store = inject(PortfolioStore);
  private readonly visitorStore = inject(VisitorStore);
  private readonly chatStore = inject(ChatStore);

  devMode = isDevMode();
  protected readonly copy = computed(() => getSiteCopy(this.store.data()?.locale ?? 'en'));

  readonly activeProfile = computed(() => this.visitorStore.profile()?.visitorType ?? null);

  setMockProfile(type: import('../shared/types/visitor.types').VisitorProfileAnalysis['visitorType'] | null) {
    if (!type) {
      this.visitorStore.setProfile(null);
      return;
    }

    this.visitorStore.setProfile({
      visitorType: type,
      confidenceScore: 1,
      interests: ['Mock Data'],
      summary: 'Mocked profile for development',
      reasoning: 'Dev Mode activated',
    });
  }

  ngOnInit() {
    this.store.loadProfile();
  }

  openChatFromLauncher() {
    this.chatStore.openChat();
  }
}
```

There are exactly eleven entries in `imports`. Do not add placeholders of any kind.

- [ ] **Step 3: Add the `.toolbar-option` class**

Append inside the `@layer components` block of `src/styles.css`:

```css
  .toolbar-option {
    font-family: var(--font-mono);
    font-size: var(--text-meta);
    line-height: 1.4;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-ink-3);
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding-block: 0.5rem;
    border-bottom: 2px solid transparent;
    background: none;
    border-inline: 0;
    border-top: 0;
    transition:
      color var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out);
  }

  .toolbar-option:hover {
    color: var(--color-ink);
  }

  .toolbar-option[aria-pressed='true'] {
    color: var(--color-ink);
    border-bottom-color: var(--color-accent);
  }
```

- [ ] **Step 4: Delete the old components**

```bash
rm -rf src/app/pages/components/intro src/app/pages/components/hero
```

- [ ] **Step 5: Build to verify the templates compile**

Run: `npm run build`
Expected: build succeeds. `intro` and `hero` no longer appear in the output.

- [ ] **Step 6: Check the rendered page**

Start `npm run dev -- --port 5173 --strictPort`, open `http://localhost:5173/`, and confirm:

- The name is one unbroken line of text, not alternating coloured letters.
- The role line sits under the name, and there is no 60px green heading.
- The portrait is on the right at 1478px and stacks under the copy at 390px.
- Focus has two columns divided by a hairline, with no cards and no icons.

- [ ] **Step 7: Commit**

```bash
git add -A src/app/pages
git commit -m "feat(design): replace intro and hero with masthead and focus areas"
```

---

### Task 7: Stack as a specimen grid

**Files:**
- Modify: `src/app/pages/components/skills-bento/skills-bento.html`
- Modify: `src/app/pages/components/skills-bento/interface/skill-bento-data.ts` if it declares an `iconFilled` flag that is no longer read (leave the field, it is data)

**Interfaces:**
- Consumes: `siteCopy.stack.eyebrow` from Task 3, `.type-meta`, `.type-h2`, `border-rule`.
- Produces: nothing new. Selector `skills-bento` and its `skills` input are unchanged.

- [ ] **Step 1: Rewrite `skills-bento.html`**

```html
<section trackBehavior="skills_viewed" class="py-16">
  <div class="page-shell">
    <p class="type-meta text-ink-3">{{ copy().stack.eyebrow }}</p>
    <h2 class="type-h2 mt-3">{{ copy().skills.title }}</h2>

    <div class="mt-10 grid grid-cols-2 gap-px bg-rule md:grid-cols-3">
      @for (skill of skills(); track skill.name) {
      <div trackBehavior="skill_viewed_{{ skill.name }}" class="bg-paper px-5 py-6">
        <span class="text-[0.9375rem] font-medium text-ink-2 transition-colors duration-150 group-hover:text-ink">{{ skill.name }}</span>
      </div>
      }
    </div>
  </div>
</section>
```

The cell wrapper needs the `group` class for the hover to work. Change the cell `div` to `class="group bg-paper px-5 py-6"`.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Check in the browser at 1478px and 390px**

The grid must be 3 columns at 1478px and 2 at 390px, cells separated by 1px hairlines only (no card borders, no shadows, no icons).

- [ ] **Step 4: Commit**

```bash
git add src/app/pages/components/skills-bento
git commit -m "feat(design): render the toolset as a hairline specimen grid"
```

---

### Task 8: About as prose plus a metric rail

**Files:**
- Modify: `src/app/pages/components/about/about.html`
- Modify: `src/app/styles.css` only if a token is missing (none should be)

**Interfaces:**
- Consumes: `SiteCopy['about']['metric']` from Task 3, `.type-metric`, `.page-shell`.
- Produces: nothing new. `about.ts` is unchanged.

- [ ] **Step 1: Rewrite `about.html`**

```html
<section trackBehavior="about_viewed" class="border-t border-rule py-24">
  <div class="page-shell">
    <div class="grid grid-cols-1 gap-12 md:grid-cols-[7fr_4fr] md:gap-16">
      <div class="min-w-0">
        <h2 class="type-h2">{{ adaptiveTitle() }}</h2>

        <div class="mt-6 max-w-[62ch] space-y-4 text-ink-2">
          @for (paragraph of visibleParagraphs(); track $index) {
          <p>{{ paragraph }}</p>
          }
        </div>

        @if (hasCollapsedPreview()) {
        <button
          type="button"
          (click)="toggleAbout()"
          [attr.aria-expanded]="isExpanded()"
          class="type-meta mt-8 inline-flex cursor-pointer items-center gap-2 border-b border-transparent pb-1 text-accent transition-colors duration-150 hover:border-current"
        >
          {{ isExpanded() ? copy().common.showLess : copy().common.showMore }}
          <span aria-hidden="true">&#8594;</span>
        </button>
        }
      </div>

      <aside class="md:border-l md:border-rule md:pl-10">
        <div class="border-b border-rule pb-8">
          <p class="type-metric text-accent">{{ copy().about.metric.value }}</p>
          <p class="mt-3 max-w-[24ch] text-ink-2">{{ copy().about.metric.caption }}</p>
        </div>

        <dl class="divide-y divide-rule">
          @for (item of data().highlights; track item.title) {
          <div class="py-5">
            <dt class="type-h3">{{ item.title }}</dt>
            <dd class="mt-1 text-ink-2">{{ item.description }}</dd>
          </div>
          }
        </dl>
      </aside>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds. If the template complains that `copy().about.metric` is missing, Task 3 was not completed.

- [ ] **Step 3: Check in the browser**

The portrait must no longer appear here (it lives in the masthead). The `.about-glass` blur, the white 1px accent bar under the heading, and the four icon circles must all be gone.

- [ ] **Step 4: Remove the now-unused glass styles**

Delete the `.about-glass`, `.link-color-primary-hover`, `.project-markdown` blocks from `src/styles.css` only when no template references them any more. `.project-markdown` is still used by the project detail page until Task 15, so leave it for now. `.about-glass` and `.link-color-primary-hover` can be deleted in this step: grep first.

Run: `rg -n "about-glass|link-color-primary-hover" src`

Expected: no output. If there is output, leave the class in place and delete it in the task that removes the last reference.

- [ ] **Step 5: Commit**

```bash
git add src/app/pages/components/about src/styles.css
git commit -m "feat(design): rebuild About as prose with a metric rail"
```

---

### Task 9: Page loader

**Files:**
- Modify: `src/app/shared/components/page-loader/page-loader.html`
- Modify: `src/styles.css` (loader bar class)

**Interfaces:**
- Produces: `.loader-bar` class.

- [ ] **Step 1: Add the loader bar class**

Inside `@layer components` in `src/styles.css`:

```css
  .loader-bar {
    height: 1px;
    width: 33%;
    background: var(--color-accent);
    animation: loader-sweep 1.4s var(--ease-out) infinite;
  }

  @keyframes loader-sweep {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(300%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .loader-bar {
      animation: none;
      width: 100%;
    }
  }
```

- [ ] **Step 2: Rewrite `page-loader.html`**

```html
<div class="flex min-h-screen items-center justify-center bg-paper" role="status" aria-live="polite">
  <div class="w-48">
    <p class="type-meta text-ink-3">{{ message() }}</p>
    <div class="mt-3 overflow-hidden border-t border-rule">
      <div class="loader-bar"></div>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Build and check**

Run: `npm run build`, then load `http://localhost:5173/` with the network throttled to see the loader. It must be paper-coloured with a single orange hairline, not a white-on-black mono line.

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/components/page-loader/page-loader.html src/styles.css
git commit -m "feat(design): restyle the page loader"
```

---

### Task 10: Projects list and section

**Files:**
- Modify: `src/app/pages/components/projects/projects-list.html`
- Modify: `src/app/pages/components/projects/projects-section.html`
- Modify: `src/app/pages/components/projects/projects-list.ts` only if the image import (`NgOptimizedImage`) becomes unused

**Interfaces:**
- Consumes: `SiteCopy['projects']['unavailable']` from Task 3.
- Produces: nothing new. Inputs and outputs unchanged.

- [ ] **Step 1: Rewrite `projects-list.html`**

```html
<div class="mt-10 border-t border-rule">
  @for (project of projects(); track project.id) {
  <article trackBehavior="project_viewed_{{ project.slug }}" class="group border-b border-rule py-8">
    <div class="grid gap-x-8 gap-y-2 md:grid-cols-[1fr_auto] md:items-baseline">
      <h3 class="text-[length:var(--text-lead)] font-medium leading-snug">
        <a
          [routerLink]="['/projects', project.slug]"
          [attr.aria-label]="openProjectAriaLabel(project.title)"
          class="text-ink transition-colors duration-150 hover:text-accent"
        >
          {{ project.title }}
        </a>
      </h3>

      <time class="type-meta text-ink-3 tabular-nums">{{ project.createdAt | date: undefined : undefined : currentDateLocale() }}</time>
    </div>

    @if (project.tags && project.tags.length > 0) {
    <p class="type-meta mt-3 text-ink-3">
      @for (t of project.tags; track t) { {{ t }}@if (!$last) {<span class="px-2" aria-hidden="true">&middot;</span>} }
    </p>
    } @if (project.description) {
    <div class="mt-3 max-w-[65ch] text-ink-2">
      <p class="whitespace-pre-wrap">{{ visibleDescription(project) }}</p>
      @if (descriptionNeedsToggle(project.description)) {
      <button type="button" class="type-meta mt-2 cursor-pointer text-accent hover:underline" (click)="toggleDescription(project.id, $event)">
        {{ descriptionExpanded(project.id) ? commonCopy().showLess : commonCopy().showMore }}
      </button>
      }
    </div>
    }

    <a
      [routerLink]="['/projects', project.slug]"
      [attr.aria-label]="openProjectAriaLabel(project.title)"
      class="type-meta mt-4 inline-flex items-center gap-2 text-accent"
      tabindex="-1"
      aria-hidden="true"
    >
      {{ projectCopy().openProjectCta }}
      <span class="transition-transform duration-150 group-hover:translate-x-0.5">&#8594;</span>
    </a>
  </article>
  }
</div>
```

Note: the cover image is intentionally not rendered. Project identity comes from the title and tags.

- [ ] **Step 2: Rewrite `projects-section.html`**

```html
<section id="projects-section" class="border-t border-rule py-20" restoreScrollPosition>
  <div class="page-shell">
    <div class="flex flex-wrap items-end justify-between gap-6">
      <div class="min-w-0">
        <h2 class="type-h2">{{ copy().projects.title }}</h2>
        <p class="mt-3 max-w-[52ch] text-ink-2">{{ copy().projects.description }}</p>
      </div>

      <a routerLink="/projects" class="type-meta inline-flex items-center gap-2 text-accent">
        {{ copy().projects.viewAll }}
        <span aria-hidden="true">&#8594;</span>
      </a>
    </div>

    @if (store.isLoading()) {
    <p class="type-meta mt-10 text-ink-3">{{ copy().projects.loading }}</p>
    } @else if (store.error()) {
    <p class="mt-10 text-accent">{{ copy().projects.error }}</p>
    } @else if ((store.data() ?? []).length === 0) {
    <p class="mt-10 max-w-[52ch] text-ink-2">{{ copy().projects.unavailable }}</p>
    } @else {
    <projects-list [projects]="(store.data() ?? []).slice(0, 3)" [locale]="locale()" />
    }
  </div>
</section>
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Check in the browser**

The projects section must be full-width rows with hairlines, not a card grid. With the current production data (zero projects) it renders one honest line and no empty box.

- [ ] **Step 5: Commit**

```bash
git add src/app/pages/components/projects
git commit -m "feat(design): render projects as editorial rows"
```

---

### Task 11: Contact form

**Files:**
- Modify: `src/app/pages/components/contact/contact.html`
- Modify: `src/app/shared/components/form-field/form-field.html`
- Modify: `src/app/shared/components/status-alert/status-alert.html`
- Modify: `src/styles.css` (`.field` class)

**Interfaces:**
- Consumes: `SiteCopy['contact']['nameLabel' | 'emailLabel' | 'messageLabel' | 'sendLabel' | 'sendingLabel']` from Task 3.
- Produces: `.field` class; field ids `contact-name`, `contact-email`, `contact-message`.

- [ ] **Step 1: Add the `.field` class**

Inside `@layer components`:

```css
  .field {
    display: block;
    width: 100%;
    background: transparent;
    border: 0;
    border-bottom: 1px solid var(--color-rule);
    border-radius: 0;
    padding: 0.625rem 0;
    color: var(--color-ink);
    font: inherit;
    transition: border-color var(--dur-fast) var(--ease-out);
  }

  .field::placeholder {
    color: var(--color-ink-3);
    opacity: 1;
  }

  .field:hover {
    border-bottom-color: var(--color-ink-3);
  }

  .field:focus,
  .field:focus-visible {
    outline: none;
    border-bottom-color: var(--color-accent);
    border-bottom-width: 2px;
    padding-bottom: calc(0.625rem - 1px);
  }

  .field[aria-invalid='true'] {
    border-bottom-color: var(--color-accent);
  }
```

- [ ] **Step 2: Rewrite the contact form block in `contact.html`**

Replace the whole `<section>`:

```html
<section trackBehavior="contact_viewed" class="border-t border-rule py-24">
  <div class="page-shell">
    <div class="grid grid-cols-1 gap-12 md:grid-cols-[5fr_7fr] md:gap-16">
      <div class="min-w-0">
        <h2 class="type-h2">{{ adaptiveTitle() }}</h2>
        <p class="mt-4 max-w-[40ch] text-ink-2">{{ adaptiveDescription() }}</p>

        <dl class="mt-10 divide-y divide-rule border-t border-rule">
          @for (feature of data().features; track feature.title) {
          <div class="py-4">
            <dt class="type-h3">{{ feature.title }}</dt>
            <dd class="mt-1 text-ink-2">{{ feature.description }}</dd>
          </div>
          }
        </dl>
      </div>

      <div class="min-w-0">
        <form (submit)="submit($event)" class="flex flex-col gap-8" novalidate>
          @if (statusMessage(); as msg) {
          <status-alert [type]="statusType()">{{ msg }}</status-alert>
          }

          <form-field [control]="form.name()">
            <label class="type-meta text-ink-3" for="contact-name">{{ copy().contact.nameLabel }}</label>
            <input id="contact-name" name="name" type="text" autocomplete="name" [formField]="form.name" [placeholder]="copy().contact.placeholderName" class="field" />
          </form-field>

          <form-field [control]="form.email()">
            <label class="type-meta text-ink-3" for="contact-email">{{ copy().contact.emailLabel }}</label>
            <input id="contact-email" name="email" type="email" autocomplete="email" [formField]="form.email" [placeholder]="copy().contact.placeholderEmail" class="field" />
          </form-field>

          <form-field [control]="form.message()">
            <label class="type-meta text-ink-3" for="contact-message">{{ copy().contact.messageLabel }}</label>
            <textarea
              id="contact-message"
              name="message"
              [formField]="form.message"
              [placeholder]="adaptivePlaceholder()"
              rows="4"
              class="field resize-none"
            ></textarea>
          </form-field>

          <button
            type="submit"
            [disabled]="!form().valid() || isSubmitting()"
            class="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-base bg-accent px-6 py-3 font-medium text-paper transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--color-accent)_88%,black)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ isSubmitting() ? copy().contact.sendingLabel : copy().contact.sendLabel }}
            <span aria-hidden="true">&#8594;</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Rewrite `form-field.html`**

```html
<div class="flex flex-col gap-2">
  <ng-content select="label"></ng-content>
  <ng-content select="input, textarea, select"></ng-content>

  @if (control().invalid() && control().touched()) {
  <div class="text-accent" role="alert">
    @for (error of control().errors(); track error) {
    <p class="text-[0.8125rem]">{{ error.message }}</p>
    }
  </div>
  }
</div>
```

- [ ] **Step 4: Rewrite `status-alert.html`**

```html
<div
  role="status"
  class="border-l-2 bg-paper-2 px-4 py-3"
  [class.border-accent]="type() === 'error'"
  [class.border-ink]="type() === 'success'"
>
  <p class="text-[0.9375rem] text-ink"><ng-content></ng-content></p>
</div>
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: succeeds. If `type()` is not exposed on `StatusAlert`, read `status-alert.ts` and use its actual signal name.

- [ ] **Step 6: Check the form in the browser**

- Three visible labels above three underline fields.
- No card around the form.
- Submitting the empty form shows accent-coloured error text under the fields.
- Tab through the form: each field shows a 2px accent underline.

- [ ] **Step 7: Commit**

```bash
git add src/app/pages/components/contact src/app/shared/components/form-field src/app/shared/components/status-alert src/styles.css
git commit -m "feat(design): rebuild the contact form with real labels"
```

---

### Task 12: Footer

**Files:**
- Modify: `src/app/pages/components/footer/footer.html`
- Modify: `src/app/pages/components/footer/footer.ts`

**Interfaces:**
- Consumes: `SiteCopy['footer']['copyright']` from Task 3, `LocaleService.copy`.

- [ ] **Step 1: Update `footer.ts`**

```ts
import { Component, computed, inject } from '@angular/core';
import { LocaleService } from '../../../shared/services/locale.service';

@Component({
  selector: 'dev-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
})
export class Footer {
  private readonly localeService = inject(LocaleService);

  readonly year = new Date().getFullYear();
  protected readonly copy = this.localeService.copy;

  readonly copyright = computed(() => this.copy().footer.copyright.replace('{year}', String(this.year)));
}
```

- [ ] **Step 2: Rewrite `footer.html`**

```html
<footer class="border-t border-rule">
  <div class="page-shell py-8">
    <p class="type-meta text-ink-3">{{ copyright() }}</p>
  </div>
</footer>
```

- [ ] **Step 3: Build and check**

Run: `npm run build`, then confirm the footer is one row of small mono text on paper, with no dark green band.

- [ ] **Step 4: Commit**

```bash
git add src/app/pages/components/footer
git commit -m "feat(design): rebuild the footer"
```

---

### Task 13: Toolbar

**Files:**
- Modify: `src/app/shared/components/site-toolbar/site-toolbar.html` (full rewrite)
- Modify: `src/app/shared/components/site-toolbar/site-toolbar.ts`

**Interfaces:**
- Consumes: `.toolbar-option` from Task 6, `AuthService`, `Router`.
- Produces: `SiteToolbarComponent.openAdmin()`, `SiteToolbarComponent.goHome()`. The admin entry point moves out of `index.page.html` and into the toolbar, so it is available on every route.

- [ ] **Step 1: Rewrite `site-toolbar.ts`**

```ts
import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'site-toolbar',
  standalone: true,
  imports: [],
  templateUrl: './site-toolbar.html',
})
export class SiteToolbarComponent {
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);

  readonly auth = inject(AuthService);

  backUrl = input<string | null>(null);
  homeUrl = input<string | null>(null);

  protected locale = this.localeService.locale;
  protected copy = this.localeService.copy;

  showBackUrl() {
    return !!this.backUrl();
  }

  showHomeUrl() {
    return !!this.homeUrl();
  }

  navigateBack() {
    const url = this.backUrl();
    if (url) {
      void this.router.navigate([url]);
    }
  }

  navigateHome() {
    const url = this.homeUrl();
    if (url) {
      void this.router.navigate([url]);
      return;
    }
    void this.router.navigateByUrl('/');
  }

  goHome() {
    void this.router.navigateByUrl('/');
  }

  openAdmin() {
    if (this.auth.isAuthenticated() && this.auth.isAdmin()) {
      void this.router.navigateByUrl('/admin');
      return;
    }
    void this.router.navigateByUrl('/admin/login');
  }
}
```

- [ ] **Step 2: Rewrite `site-toolbar.html`**

```html
<header class="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur-md">
  <div class="page-shell flex h-[52px] items-center gap-6">
    <a (click)="goHome()" class="cursor-pointer font-mono text-[0.8125rem] font-semibold tracking-[0.04em] text-ink">RK</a>

    <div class="hidden items-center gap-5 sm:flex">
      <ng-content></ng-content>
    </div>

    <div class="ml-auto flex items-center gap-5">
      @if (showBackUrl()) {
      <button (click)="navigateBack()" class="toolbar-option cursor-pointer">{{ copy().devProxy.back }}</button>
      } @if (showHomeUrl()) {
      <button (click)="navigateHome()" class="toolbar-option cursor-pointer">{{ copy().devProxy.home }}</button>
      } @if (auth.authInitialized() && auth.isAuthenticated() && auth.isAdmin()) {
      <button (click)="openAdmin()" class="toolbar-option cursor-pointer">{{ copy().home.adminPage }}</button>
      } @else if (auth.authInitialized() && !auth.isAuthenticated()) {
      <button (click)="openAdmin()" class="toolbar-option cursor-pointer">{{ copy().home.admin }}</button>
      }
    </div>
  </div>
</header>
```

- [ ] **Step 3: Build and measure the toolbar**

Run: `npm run build`, open the page, and evaluate:

```js
document.querySelector('header').getBoundingClientRect().height
```

Expected: `52`. At 390px width it must still be `52`, and the profile switcher must be hidden.

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/components/site-toolbar
git commit -m "feat(design): rebuild the toolbar and move admin into it"
```

---

### Task 14: Chat widget

**Files:**
- Modify: `src/app/ai-engine/chat/chat-widget.html`

**Interfaces:**
- Consumes: `SiteCopy['chat']['launcherLabel']` from Task 3.
- Produces: nothing new. All bindings, `chatStore` calls, and `#messagesContainer` stay identical.

- [ ] **Step 1: Rewrite `chat-widget.html`**

```html
<div class="fixed bottom-6 right-6 z-50">
  <button
    type="button"
    (click)="toggleChat()"
    [attr.aria-label]="chatStore.isOpen() ? copy().chat.toggleCloseAriaLabel : copy().chat.toggleOpenAriaLabel"
    [attr.aria-expanded]="chatStore.isOpen()"
    class="type-meta inline-flex cursor-pointer items-center gap-2 rounded-base bg-ink px-4 py-3 text-paper transition-colors duration-150 hover:bg-accent"
  >
    @if (chatStore.isOpen()) {
    <span aria-hidden="true">&#10005;</span>
    } @else {
    <span aria-hidden="true">&#8594;</span>
    }
    {{ chatStore.isOpen() ? copy().chat.toggleCloseAriaLabel : copy().chat.launcherLabel }}
  </button>

  @if (chatStore.isOpen()) {
  <div
    class="fixed bottom-24 right-2 flex h-[68vh] max-h-[68vh] w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-base border border-rule bg-surface shadow-[0_12px_32px_rgb(16_17_19_/_0.08)] sm:absolute sm:bottom-16 sm:left-auto sm:right-0 sm:top-auto sm:h-125 sm:max-h-[80vh] sm:w-80 md:w-96"
  >
    <div class="flex items-center gap-3 border-b border-rule bg-paper-2 p-4">
      <div class="flex size-9 shrink-0 items-center justify-center rounded-base border border-accent">
        <span class="type-meta text-accent">RK</span>
      </div>
      <div class="min-w-0">
        <p class="type-h3">{{ copy().chat.title }}</p>
        <p class="type-meta mt-0.5 text-ink-3">{{ copy().chat.subtitle }}</p>
      </div>
    </div>

    <div #messagesContainer class="flex-1 space-y-4 overflow-y-auto overscroll-contain bg-paper p-4">
      @if (chatStore.messages().length === 0) {
      <div class="mt-6">
        <p class="text-ink-2">{{ copy().chat.introLine1 }}</p>
        <p class="mt-2 text-ink-2">{{ copy().chat.introLine2 }}</p>
        <div class="mt-6 divide-y divide-rule border-t border-rule">
          <button
            (click)="newMessage.set(copy().chat.promptAngular); sendMessage()"
            [disabled]="chatStore.isTyping()"
            class="block w-full cursor-pointer py-3 text-left text-ink-2 transition-colors duration-150 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ copy().chat.promptAngular }}
          </button>
          <button
            (click)="newMessage.set(copy().chat.promptFreelance); sendMessage()"
            [disabled]="chatStore.isTyping()"
            class="block w-full cursor-pointer py-3 text-left text-ink-2 transition-colors duration-150 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ copy().chat.promptFreelance }}
          </button>
        </div>
      </div>
      } @for (msg of chatStore.messages(); track $index) {
      <div [class]="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
        <div
          [class]="
            msg.role === 'user'
              ? 'max-w-[80%] rounded-base bg-ink px-4 py-2 text-paper'
              : 'max-w-[80%] rounded-base border border-rule bg-surface px-4 py-2 text-ink'
          "
        >
          @if (msg.role === 'assistant') {
          <div class="chat-markdown" [safeHtml]="renderAssistantMessage(msg.content)"></div>
          } @else { {{ msg.content }} }
        </div>
      </div>
      } @if (chatStore.isTyping()) {
      <div class="flex items-center gap-1.5">
        <span class="size-1.5 animate-bounce rounded-full bg-ink-3"></span>
        <span class="size-1.5 animate-bounce rounded-full bg-ink-3" style="animation-delay: 0.15s"></span>
        <span class="size-1.5 animate-bounce rounded-full bg-ink-3" style="animation-delay: 0.3s"></span>
        <span class="sr-only">{{ copy().chat.typingSrOnly }}</span>
      </div>
      }
    </div>

    <div class="border-t border-rule bg-paper-2 p-3">
      <form (submit)="sendMessage($event)" class="flex items-end gap-3">
        <input
          type="text"
          [value]="newMessage()"
          (input)="onInputChange($event)"
          (keyup.enter)="sendMessage()"
          [placeholder]="copy().chat.placeholder"
          class="field flex-1"
          autocomplete="off"
        />
        <button
          type="submit"
          [disabled]="!newMessage().trim() || chatStore.isTyping()"
          [attr.aria-label]="copy().chat.sendAriaLabel"
          class="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-base bg-accent text-paper transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true">&#8594;</span>
        </button>
      </form>
    </div>
  </div>
  }
</div>
```

The typing dots keep `rounded-full` because they are 6px glyphs, not containers. That is the only permitted `rounded-full` besides the portrait ring.

- [ ] **Step 2: Build and check**

Run: `npm run build`, open the page, click the launcher, and confirm:

- The launcher is a rectangle, not a circle.
- The panel is paper-coloured with a hairline border.
- Suggested prompts are hairline rows, not pills.
- No element in the panel has a 12px or larger radius.

- [ ] **Step 3: Commit**

```bash
git add src/app/ai-engine/chat/chat-widget.html
git commit -m "feat(design): rebuild the chat widget on the Dossier system"
```

---

### Task 15: Projects index, detail and edit pages

**Files:**
- Modify: `src/app/pages/projects/index.page.html`
- Modify: `src/app/pages/projects/[slug]/index.page.html`
- Modify: `src/app/pages/projects/[slug]/edit.page.html`
- Modify: `src/styles.css` (`.project-markdown` rewritten against tokens)
- Modify: `src/app/shared/markdown/project-markdown-renderer.ts` only if it emits inline hex colours

**Interfaces:**
- Consumes: all tokens from Task 1.
- Produces: nothing new.

- [ ] **Step 1: Rewrite the projects index main block**

```html
<main id="main" class="min-h-screen bg-paper pb-24 pt-16">
  <div class="page-shell">
    <div class="flex flex-wrap items-end justify-between gap-6 border-b border-rule pb-6">
      <h1 class="type-display">{{ copy().projectsPage.title }}</h1>

      <a [routerLink]="['/']" fragment="projects-section" class="type-meta mb-2 inline-flex items-center gap-2 text-ink-3 transition-colors hover:text-accent">
        <span aria-hidden="true">&#8592;</span>
        {{ copy().projectsPage.backToPortfolio }}
      </a>
    </div>

    @if (store.isLoading()) {
    <p class="type-meta mt-10 text-ink-3">{{ copy().projectsPage.loading }}</p>
    } @else if (store.error()) {
    <p class="mt-10 text-accent">{{ copy().projectsPage.error }}</p>
    } @else if ((store.data() ?? []).length === 0) {
    <p class="mt-10 text-ink-2">{{ copy().projectsPage.empty }}</p>
    } @else {
    <projects-list [projects]="store.data()!" [locale]="locale()" />
    }
  </div>
</main>
```

- [ ] **Step 2: Rewrite the `.project-markdown` block in `styles.css`**

Replace the existing block with:

```css
  .project-markdown {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--color-ink-2);
  }

  .project-markdown > * + * {
    margin-top: 1rem;
  }

  .project-markdown h2 {
    font-size: var(--text-h2);
    line-height: 1.1;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--color-ink);
    margin-top: 2.5rem;
  }

  .project-markdown h3 {
    font-size: var(--text-h3);
    font-weight: 600;
    color: var(--color-ink);
    margin-top: 2rem;
  }

  .project-markdown p,
  .project-markdown li {
    max-width: 65ch;
  }

  .project-markdown a {
    color: var(--color-accent);
    text-underline-offset: 4px;
  }

  .project-markdown .markdown-table-wrap {
    margin-block: 1.5rem;
    overflow-x: auto;
    border: 1px solid var(--color-rule);
    border-radius: var(--radius-base);
  }

  .project-markdown table {
    width: 100%;
    min-width: 20rem;
    border-collapse: collapse;
  }

  .project-markdown th,
  .project-markdown td {
    border-bottom: 1px solid var(--color-rule);
    padding: 0.75rem 1rem;
    text-align: left;
    vertical-align: top;
  }

  .project-markdown th {
    font-family: var(--font-mono);
    font-size: var(--text-meta);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-ink-3);
    font-weight: 500;
  }

  .project-markdown td:first-child {
    font-weight: 500;
    color: var(--color-ink);
    min-width: 7rem;
  }

  .project-markdown code {
    font-family: var(--font-mono);
    font-size: 0.875em;
    background: var(--color-paper-2);
    border: 1px solid var(--color-rule);
    border-radius: var(--radius-base);
    padding: 0.125rem 0.375rem;
  }

  .project-markdown pre {
    background: var(--color-surface);
    border: 1px solid var(--color-rule);
    border-radius: var(--radius-base);
    padding: 1rem;
    overflow-x: auto;
  }

  .project-markdown pre code {
    background: none;
    border: 0;
    padding: 0;
  }
```

- [ ] **Step 3: Restyle the project detail page**

Apply the same vocabulary to `[slug]/index.page.html`. The page uses `max-w-6xl`; replace it with `page-shell`. Replace every `text-primary`, `bg-surface`, `border-[#...]`, `text-gray-*`, `text-white`, `rounded-xl`, `rounded-lg` with the mapped token class. The article container takes `max-w-[65ch]` plus the markdown block.

Use this exact mapping for both `[slug]/index.page.html` and `[slug]/edit.page.html`:

| Current | Replacement |
| --- | --- |
| `text-primary` | `text-accent` |
| `bg-surface` | `bg-surface` (unchanged) |
| `text-white` | `text-ink` |
| `text-gray-300` | `text-ink-2` |
| `text-gray-400` | `text-ink-2` |
| `text-gray-500` | `text-ink-3` |
| `border-[#143c1a]` | `border-rule` |
| `border-[#0f2e15]` | `border-rule` |
| `bg-[#020a04]` | `bg-paper` |
| `bg-[#0a2912]` | `bg-paper-2` |
| `bg-[#07200f]` | `bg-paper-2` |
| `rounded-xl` | `rounded-base` |
| `rounded-lg` | `rounded-base` |
| `rounded-md` | `rounded-base` |
| `hover:bg-[#16a34a]` | `hover:bg-accent` |
| `bg-primary text-black` | `bg-accent text-paper` |
| `max-w-6xl` | `page-shell` on the wrapper |
| `text-4xl`, `text-5xl`, `text-3xl` on an `h1` | `type-display` |
| `text-3xl`, `text-2xl` on an `h2` | `type-h2` |

- [ ] **Step 4: Grep for leftovers**

Run: `rg -n "#[0-9a-fA-F]{6}|text-white|text-gray-[0-9]|bg-primary|rounded-(xl|lg|md|full)" src/app/pages/projects`
Expected: no output.

- [ ] **Step 5: Build and check**

Run: `npm run build`. Open `/portfolio/projects` and confirm the heading is display-sized on paper, the back link is mono, and the empty state is a single line.

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/projects src/styles.css src/app/shared/markdown
git commit -m "feat(design): rebuild project pages on the Dossier system"
```

---

### Task 16: Admin shell and pages, plus the template colour gate

**Files:**
- Modify: `src/app/pages/admin/(dashboard)/layout/layout.html`
- Modify: `src/app/pages/admin/(dashboard)/index.page.html`
- Modify: `src/app/pages/admin/(dashboard)/projects/page/projects.page.html`
- Modify: `src/app/pages/admin/(dashboard)/messages/messages.page.html`
- Modify: `src/app/pages/admin/(dashboard)/intelligence/intelligence.page.html`
- Modify: `src/app/pages/admin/login/index.page.html`
- Modify: `src/app/shared/components/project-form/project-form.html`
- Modify: `src/styles.css` (`.admin-*` classes)
- Test: `src/design-system.spec.ts` (extend)

**Interfaces:**
- Consumes: every token from Task 1.
- Produces: `.admin-card`, `.admin-h1`, `.admin-h2`, `.admin-btn`, `.admin-btn-primary`, `.admin-chip`, `.admin-row`.

- [ ] **Step 1: Add the admin component classes**

Inside `@layer components`:

```css
  .admin-card {
    background: var(--color-surface);
    border: 1px solid var(--color-rule);
    border-radius: var(--radius-base);
    padding: 1.5rem;
  }

  .admin-h1 {
    font-size: var(--text-h2);
    line-height: 1.1;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--color-ink);
  }

  .admin-h2 {
    font-size: var(--text-h3);
    line-height: 1.4;
    font-weight: 600;
    color: var(--color-ink);
  }

  .admin-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: 1px solid var(--color-rule);
    border-radius: var(--radius-base);
    background: transparent;
    padding: 0.5rem 0.875rem;
    font-size: var(--text-small);
    font-weight: 500;
    color: var(--color-ink-2);
    cursor: pointer;
    transition:
      color var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out);
  }

  .admin-btn:hover {
    color: var(--color-ink);
    border-color: var(--color-ink-3);
  }

  .admin-btn-primary {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-paper);
  }

  .admin-btn-primary:hover {
    background: color-mix(in srgb, var(--color-accent) 88%, black);
    border-color: transparent;
    color: var(--color-paper);
  }

  .admin-chip {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--color-rule);
    border-radius: var(--radius-base);
    padding: 0.125rem 0.5rem;
    font-family: var(--font-mono);
    font-size: var(--text-meta);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-ink-3);
  }

  .admin-chip[data-live='true'] {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .admin-row {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    border-bottom: 1px solid var(--color-rule);
    padding: 1rem 0;
  }

  .admin-link {
    font-size: var(--text-small);
    color: var(--color-ink-3);
    cursor: pointer;
    transition: color var(--dur-fast) var(--ease-out);
  }

  .admin-link:hover {
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 4px;
  }
```

- [ ] **Step 2: Rewrite the admin layout**

```html
<div class="flex min-h-screen bg-paper">
  <aside class="flex w-56 shrink-0 flex-col border-r border-rule bg-surface">
    <div class="border-b border-rule p-5">
      <p class="font-mono text-[0.8125rem] font-semibold tracking-[0.04em] text-ink">RK</p>
      <p class="type-meta mt-1 text-ink-3">Portfolio CMS</p>
    </div>

    <nav class="flex-1 space-y-0.5 p-3">
      <a
        routerLink="/admin"
        [routerLinkActiveOptions]="{ exact: true }"
        routerLinkActive="border-accent text-ink"
        class="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-ink-2 transition-colors duration-150 hover:text-ink"
      >
        Dashboard
      </a>
      <a
        routerLink="/admin/projects"
        routerLinkActive="border-accent text-ink"
        class="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-ink-2 transition-colors duration-150 hover:text-ink"
      >
        Projects
      </a>
      <a
        routerLink="/admin/messages"
        routerLinkActive="border-accent text-ink"
        class="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-ink-2 transition-colors duration-150 hover:text-ink"
      >
        Messages
      </a>
      <a
        routerLink="/admin/intelligence"
        routerLinkActive="border-accent text-ink"
        class="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-ink-2 transition-colors duration-150 hover:text-ink"
      >
        Intelligence
      </a>
    </nav>

    <div class="border-t border-rule p-3">
      <button (click)="logout()" class="admin-link w-full px-3 py-2 text-left">Logout</button>
    </div>
  </aside>

  <main class="min-h-0 flex-1 overflow-auto" fadeIn>
    <router-outlet />
  </main>
</div>
```

The SVG nav icons are removed. Admin navigation is text, matching the public surface.

- [ ] **Step 3: Apply the token mapping to the four admin pages and the project form**

Use this exact mapping, in this order, for `index.page.html`, `projects/page/projects.page.html`, `messages/messages.page.html`, `intelligence/intelligence.page.html`, `login/index.page.html`, and `shared/components/project-form/project-form.html`:

| Current | Replacement |
| --- | --- |
| `text-white` | `text-ink` |
| `text-gray-200` | `text-ink-2` |
| `text-gray-300` | `text-ink-2` |
| `text-gray-400` | `text-ink-2` |
| `text-gray-500` | `text-ink-3` |
| `text-primary` | `text-accent` |
| `text-red-400` | `text-accent` |
| `bg-[#030f06]`, `bg-[#060e07]`, `bg-[#020a04]` | `bg-paper` |
| `bg-[#0a2912]`, `bg-[#0a1a0f]`, `bg-[#07200f]` | `bg-paper-2` |
| `border-[#143c1a]`, `border-[#0f2e15]` | `border-rule` |
| `border-gray-800` | `border-rule` |
| `bg-gray-800`, `bg-gray-900` | `bg-paper-2` |
| `hover:bg-gray-700`, `hover:bg-gray-800` | `hover:bg-surface` |
| `bg-primary text-black` | `bg-accent text-paper` |
| `hover:bg-[#16a34a]` | `hover:bg-accent` |
| `bg-green-900 text-green-300` | `admin-chip` with `data-live="true"` |
| `bg-gray-800 text-gray-400` (chip) | `admin-chip` |
| `rounded-xl`, `rounded-lg`, `rounded-md` | `rounded-base` |
| `text-3xl font-bold` on `h1` | `admin-h1` |
| `text-xl font-semibold` on `h2` | `admin-h2` |
| `bg-surface border border-[#143c1a] rounded-xl p-6 shadow-lg` | `admin-card` |
| `shadow-2xl`, `shadow-lg` | remove |
| `gap12` | `gap-2` |

Then replace the recurring patterns by hand:

- Every stat tile in `index.page.html` becomes `<div class="admin-card"><h2 class="admin-h2">...</h2><p class="type-metric mt-2 text-ink">...</p></div>`.
- Every quick-navigation tile becomes `<a routerLink="..." class="admin-card group"><p class="admin-h2 text-accent group-hover:underline">Projects →</p><p class="mt-1 text-small text-ink-2">Create and manage portfolio projects</p></a>`.
- Every project row in `projects/page/projects.page.html` becomes `<div class="admin-row md:flex-row md:items-center md:justify-between">` with the existing children, `admin-chip` for the published state, and `admin-link` for the view/edit/delete links.
- Every text input and textarea in `project-form.html` and `login/index.page.html` gets `class="field"` and a `<label class="type-meta text-ink-3">` above it.

- [ ] **Step 4: Extend the design system test with the template colour gate**

Append to `src/design-system.spec.ts`:

```ts
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function templateFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return templateFiles(full);
    return full.endsWith('.html') ? [full] : [];
  });
}

describe('templates', () => {
  const appDir = fileURLToPath(new URL('./app', import.meta.url));

  it('contain no hardcoded hex colours', () => {
    const offenders = templateFiles(appDir).filter((file) => /#[0-9a-fA-F]{3,8}\b/.test(readFileSync(file, 'utf8').replace(/&#\d+;/g, '')));
    expect(offenders).toEqual([]);
  });

  it('use no pill or large corner radii', () => {
    const offenders = templateFiles(appDir).filter((file) => /rounded-(xl|lg|md|2xl|3xl)\b/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
```

`rounded-full` is deliberately not banned by the regex, because the typing dots and the portrait ring use it. Any other use is a review failure.

- [ ] **Step 5: Sweep em-dashes out of rendered copy**

Run: `rg -n "\u2014|\u2013" src/app src/server/data`

Replace every hit in a template or copy file with a hyphen, a comma, a colon, or two sentences. Code comments and markdown docs are exempt; anything that renders is not. Re-run until the command returns no results.

- [ ] **Step 6: Run the full gate**

Run: `npx vitest run src/design-system.spec.ts`
Expected: PASS, 7 tests. Any remaining hex shown in the failure list names the exact file.

- [ ] **Step 7: Run the full verification suite**

Run: `npm run verify`
Expected: lint, typecheck and tests all pass.

- [ ] **Step 8: Final browser pass**

At 1478px and 390px, on `/`, `/projects`, a project detail route if any exists, `/admin/login`, and `/admin` while authenticated:

- Toolbar exactly 52px.
- No horizontal overflow (`document.documentElement.scrollWidth === clientWidth`).
- No section gap equals its neighbour's gap.
- `prefers-reduced-motion: reduce` emulation shows all content with no animation.
- `prefers-color-scheme: dark` emulation shows no light surface left over.

- [ ] **Step 9: Commit**

```bash
git add -A src/app/pages/admin src/app/shared/components/project-form src/styles.css src/design-system.spec.ts
git commit -m "feat(design): bring the admin onto the Dossier system and gate templates against hex colours"
```
