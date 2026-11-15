# Stylesheet Architecture and Print Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Close the dark-mode print hole, delete the tokens and classes nothing uses, collapse the seven copies of the mono meta recipe into the token that should have generated it, split the 1740-line stylesheet into owned files behind one entry, make the sticky-header offset a single measured value, and give the CV page the one component stylesheet it can safely own.

**Architecture:** `src/styles.css` stays the single entry and keeps `@import 'tailwindcss'`, `@theme` and `:root` — it is the palette contract that `src/design-system.spec.ts` reads. Every other rule moves into `src/styles/*.css`, imported from the entry, **still global**: Angular's emulated encapsulation cannot style projected `ng-content` (`.field`, `.toolbar-option`) or sanitized `innerHTML` (`.project-markdown`, `.chat-markdown`), so those must never become component styles. Only the CV page qualifies for scoping — static template, single owner, no projection, no injected HTML — and it gets `src/app/pages/cv/index.page.css`. Every custom rule lives in `@layer components` except a documented, short list that has to beat Tailwind utilities.

**Tech Stack:** Angular 22 with default `ViewEncapsulation.Emulated`, Tailwind CSS v4.3 (`@theme`, `@layer`, `@apply`, `--text-*--line-height`), Vite 8 via `@analogjs/platform`, Vitest (`src/design-system.spec.ts`), Prettier, npm scripts `test:ci` / `typecheck` / `lint` / `format:check` / `build`.

---

## Execution record (2026-11-15)

All nine tasks landed on `refactor/stylesheet-architecture`, `1895365..38fe48b`.
Boxes are ticked as "the outcome exists", not as "the original wording ran
unchanged" — five places had to be corrected mid-flight, and each correction is
in the step text above so a replay does not reintroduce the bug:

- **Task 2** — the plan claimed `.type-title` and `.bleed` were dead. They were
  not; PowerShell's `-Path` wildcards were silently skipping
  `src/app/pages/projects/[slug]/`. Scope narrowed, both kept.
- **Task 3** — the "exact" reduced-motion block was not a superset; it dropped
  `animation: none !important` from `.scroll-progress`.
- **Task 5** — `@theme static` is required, not cosmetic: Tailwind otherwise
  tree-shakes the `--text-*` tokens that only plain `var()` consumes.
- **Task 6** — splitting the file moved the desktop `--gutter` override and the
  print palette *before* the entry's `:root`, which resurrected the dark-print
  bug. Token overrides must live in the entry, after the blocks they override.
- **Task 8** — `main#main` in the CV print block was not a `.cv-*` rule and had
  to stay global; the `@page` assertion was matching a word the prescribed
  comment contains.

`src/styles/` ended up as nine files, not the ten the plan's file list implies:
`cv.css` was the temporary home and is deleted.


---

## Global Constraints

- No visual change to any screen. The only intended visual delta in the whole plan is in print output, plus one line-height normalisation on `.admin-chip` called out in Task 5.
- No palette hex is invented, moved or retuned. Print prints the light palette. `#f1f2f2`, `#e9eaea`, `#fafafa`, `#101113`, `#4c5054`, `#63686d`, `#d6d8d9`, `#c0430f`, `#f7e9e2`, `#fdf8f4`, `#f4e9e2`, `#e2cabe` are the only light values, and they are always written as `var(--color-*)` outside the two palette blocks.
- No `#fff`, no `#ffffff`, no `#000`, no `#000000`, no `black` keyword, no `Inter`. These are enforced by `src/design-system.spec.ts`.
- No new dependency. No build-config change. No template class-name change.
- No `!important` outside `@media print` and the single reduced-motion block.
- Every custom rule sits in `@layer base` or `@layer components`, except the allowlist in Task 9: `[data-toolbar-mobile]`, `footer .page-shell`, `.skill-grid`, `.skill-cell`, the reduced-motion block, and `@media print`.
- `@page` stays in the global print stylesheet. It is a document at-rule; a component stylesheet outlives its route and would leave A4 margins on every later print.
- The 13px floor applies to page chrome and `.type-*`. The CV sheet is a document measured in its own scale; that exemption is written down in Task 5 and must be stated in the token comment.
- Tests: `npm run test:ci` green after every task. `npm run build` green after Tasks 5, 6, 8 and 9. Each task ends in one commit.

## Working tree before Task 1

`git status --short` shows only `?? docs/cv/`. Do not stage `docs/cv/` in any commit from this plan. The last commit is `1895365 feat(nav): put the CV one click from the top`.

---

### Task 1: Print with the light palette in dark mode

The print block resets seven of thirteen colour tokens. Printed from a dark-mode reader, `--color-accent` stays `#ff8350`, `--color-accent-wash` stays `#2a1a13`, and the chat/scrim surfaces stay dark, which is exactly what the comment above the block promises is prevented.

**Files:**
- Modify: `src/design-system.spec.ts`
- Modify: `src/styles.css` (`@media (prefers-color-scheme: dark)` stays; `@media print` palette and the four literal-colour declarations change)

**Interfaces:**
- Produces: `blockFor(source: string, marker: string): string` in the spec, a brace-matched block extractor that replaces the fragile `indexOf('\n}')` slicing. Tasks 6 and 8 keep relying on the resulting `css` constant.
- Produces: the stable comment anchor `/* Print palette` immediately above the print `:root`, which the spec matches on.

- [x] **Step 1: Write the failing tests**

In `src/design-system.spec.ts`, replace the `darkBlock` initialiser with the helper and keep every existing assertion intact:

```typescript
/** Body of the first top-level block whose header contains `marker`, brace-matched. */
function blockFor(source: string, marker: string): string {
  const start = source.indexOf(marker);
  if (start === -1) return '';
  const open = source.indexOf('{', start);
  if (open === -1) return '';
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  return source.slice(open + 1);
}

const COLOUR_TOKENS = [
  'paper',
  'paper-2',
  'surface',
  'ink',
  'ink-2',
  'ink-3',
  'rule',
  'accent',
  'accent-wash',
  'chat',
  'chat-2',
  'chat-rule',
  'scrim',
] as const;

const darkBlock = blockFor(css, '@media (prefers-color-scheme: dark)');
```

Add these two tests inside `describe('design tokens', ...)`, after the existing `overrides every colour token in the dark block` test:

```typescript
  it('overrides every colour token in the print block', () => {
    // A dark reader who prints must get the light sheet. Seven of the thirteen
    // tokens used to be missing here, so accents and the chat surface printed
    // as dark blocks on white paper.
    const printBlock = blockFor(css, '/* Print palette');
    expect(printBlock).not.toBe('');

    for (const token of COLOUR_TOKENS) {
      expect(printBlock, `print must set --color-${token}`).toContain(`--color-${token}:`);
    }
  });

  it('keeps every dark colour override inside the dark block', () => {
    for (const token of COLOUR_TOKENS) {
      expect(darkBlock, `dark must set --color-${token}`).toContain(`--color-${token}:`);
    }
  });
```

Then extend the existing `does not use Inter or pure black` test with two assertions at the end of its body:

```typescript
    expect(css).not.toMatch(/#fff(?:fff)?\b/i);
    expect(css).not.toMatch(/\bblack\b/);
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/design-system.spec.ts`

Expected: 2 failures. `overrides every colour token in the print block` fails first on `expect(printBlock).not.toBe('')`, because there is no `/* Print palette` anchor in the file yet. Once the comment exists it reports `print must set --color-accent`. `does not use Inter or pure black` fails on `#fff` found at `main#main` in the print block.

- [x] **Step 3: Complete the print palette**

In `src/styles.css`, immediately above the print `:root`, add the anchor comment and the six missing tokens. The block must read exactly:

```css
@media print {
  /* Print palette. Always the light sheet, whatever the reader's scheme is.
     Tested in src/design-system.spec.ts: every token the screen palette
     declares must be overridden here, or a dark-mode print comes out as a
     block of ink with a pale-orange accent. Shadow tokens are not listed
     because the only surfaces wearing them (chat panel, zoom dialog) are
     hidden below. */
  :root {
    --color-paper: #f1f2f2;
    --color-paper-2: #e9eaea;
    --color-surface: #fafafa;
    --color-ink: #101113;
    --color-ink-2: #4c5054;
    --color-ink-3: #63686d;
    --color-rule: #d6d8d9;
    --color-accent: #c0430f;
    --color-accent-wash: #f7e9e2;
    --color-chat: #fdf8f4;
    --color-chat-2: #f4e9e2;
    --color-chat-rule: #e2cabe;
    --color-scrim: #101113;
  }
```

- [x] **Step 4: Replace the literal colours in the print blocks**

Four declarations currently spell hexes that now have tokens. Replace them one for one:

```css
  html,
  body {
    background: var(--color-paper) !important;
    color: var(--color-ink) !important;
  }
```

```css
  main#main {
    padding: 0 !important;
    background: var(--color-paper) !important;
  }
```

```css
  a {
    color: var(--color-ink) !important;
    text-decoration: underline;
  }
```

```css
  .cv-contact a,
  .cv-sheet a {
    color: var(--color-ink) !important;
    text-decoration: underline;
  }
```

- [x] **Step 5: Remove the `black` keyword from the button hover**

In `.admin-btn-primary:hover`, replace `black` with the scrim token. In the light scheme `--color-scrim` is `#101113`, so the mix is visually identical; in a dark scheme it no longer brightens the button by mixing with pure black.

```css
  .admin-btn-primary:hover {
    background: color-mix(in srgb, var(--color-accent) 88%, var(--color-scrim));
    border-color: transparent;
    color: var(--color-paper);
  }
```

- [x] **Step 6: Run the tests and the build**

Run: `npx vitest run src/design-system.spec.ts`
Expected: PASS, no failures.

Run: `npm run build`
Expected: exit 0, `[build]` tail with no warnings beyond the existing ones.

- [x] **Step 7: Commit**

```bash
git add -- src/styles.css src/design-system.spec.ts
git commit -m "fix(styles): print the light palette from a dark scheme"
```

---

### Task 2: Delete the tokens and classes nothing uses

`--color-background`, `--color-primary` and `.portrait-settle` have zero references across `src/**/*.html` and `src/**/*.ts`. Two of the tokens are pinned by the design-system spec, so the spec changes in the same commit.

**Scope correction (2026-11-15).** The first draft of this task also deleted `.type-title` / `--text-title` and `.bleed`. It was wrong: commit `77f5154` *feat(project): give the case study a full width and a facts rail* added `.bleed` to the stylesheet and both `.type-title` and `.bleed` to `src/app/pages/projects/[slug]/index.page.html` (lines 27 and 38). They are live, so deleting them breaks the case-study page. They are kept here and re-homed instead:
- `--text-title` moves into `@theme` in Task 5, so the `.type-title` clamp becomes a real `text-title` utility.
- `.bleed` moves into `src/styles/primitives.css` in Task 6 with the rest of the primitives. It is not dead, it was only mis-filed.

The original reference check also searched for `\.bleed`, which matches a CSS selector and never a `class="bleed"` attribute — the blind spot that let the stale claim through. Step 1 uses a word-boundary pattern for that reason.

**Second blind spot, same origin.** The claim was almost certainly produced with PowerShell `Select-String -Path`, which treats `[` `]` as wildcards and therefore **silently skips `src/app/pages/projects/[slug]/`** — returning 0 matches with no error. See the tooling note in `.superpowers/sdd/progress.md`. Reference checks in this plan use `rg`; if a PowerShell cmdlet is ever used, it must be `-LiteralPath`.

**Files:**
- Modify: `src/styles.css`
- Modify: `src/design-system.spec.ts`

- [x] **Step 1: Confirm the references are gone**

Run: `rg -n -w -e "type-title" -e "text-title" -e "bleed" -e "portrait-settle" -e "color-background" -e "color-primary" -e "bg-background" -e "text-primary" -e "bg-primary" src`

Expected: matches only inside `src/styles.css` and `src/design-system.spec.ts`. The two exceptions are deliberate, not dead code: `.type-title` and `.bleed` will also match `src/app/pages/projects/[slug]/index.page.html` — leave both alone. Any *other* template match means the assumption is wrong again; stop and report rather than deleting.

- [x] **Step 2: Remove the alias tokens**

In `src/styles.css`, delete this pair from `@theme` (and its stale comment):

```css
  /* Aliases kept so templates that are not migrated yet still resolve. */
  --color-background: #f1f2f2;
  --color-primary: #c0430f;
```

Delete the matching two lines from the `@media (prefers-color-scheme: dark)` block:

```css
    --color-background: #141516;
    --color-primary: #ff8350;
```

- [x] **Step 3: Remove `.portrait-settle`**

Three places:
1. Delete the `@keyframes portrait-settle` block.
2. Delete the `@supports (animation-timeline: view())` rule for `.portrait-settle` and keep the `.shot-parallax` sibling and its comment.
3. Remove `.portrait-settle` from both selector lists that still name it: the reduced-motion list (`.enter, [data-stagger], .chat-bubble, .chat-panel, .portrait-settle`) and the print list (`.reveal, .reveal[data-visible='true'], .hero-portrait, .hero-cta, .shot-parallax, .project-shot`).

- [x] **Step 4: Remove the aliases from the print palette too**

The print `:root` (the `@media print` block) also declares `--color-background: #f1f2f2;` and `--color-primary: #c0430f;`. Delete both, otherwise the print block keeps tokens the screen palette no longer has and the "every screen token is overridden for print" invariant breaks.

- [x] **Step 5: Update the spec**

In `src/design-system.spec.ts`, delete these four assertion lines:

```typescript
    expect(css).toContain('--color-background: #f1f2f2');
    expect(css).toContain('--color-primary: #c0430f');
```

```typescript
      '--color-background: #141516',
      '--color-primary: #ff8350',
```

Also delete the two matching entries from `COLOUR_TOKENS` in the same file, so the print and dark loops stop requiring tokens that no longer exist:

```typescript
  'background',
```

```typescript
  'primary',
```

After this step `COLOUR_TOKENS` has 13 entries and both block tests still pass, because the light, dark and print blocks all declare exactly those 13.

- [x] **Step 6: Run the suite**

Run: `npm run test:ci`
Expected: PASS. Run `npm run build` if the diff touched `@theme` shape; expected exit 0.

- [x] **Step 7: Commit**

```bash
git add -- src/styles.css src/design-system.spec.ts
git commit -m "refactor(styles): drop unused tokens and classes"
```

---

### Task 3: One reduced-motion block

Four separate `@media (prefers-reduced-motion: reduce)` blocks exist: two nested inside the first `@layer components` block, one inside the second, one unlayered. `.reveal` is neutralised twice with different techniques, so the two can drift.

**Files:**
- Modify: `src/styles.css`
- Modify: `src/design-system.spec.ts`

- [x] **Step 1: Write the failing test**

Add to `describe('design tokens', ...)`:

```typescript
  it('declares the reduced-motion overrides once', () => {
    expect((css.match(/prefers-reduced-motion/g) ?? []).length).toBe(1);
  });
```

Run: `npx vitest run src/design-system.spec.ts`
Expected: FAIL, received 4.

Add a second test in the same step. It is a guard, not a red test: the three blocks are consistent right now, so it passes immediately. Its job is to stop a future edit from adding a token to one block only — which is exactly how `--color-background` and `--color-primary` survived until Task 2.

```typescript
  it('declares the same colour tokens in the light, dark and print blocks', () => {
    // Presence-only loops let a block carry extra tokens into the other palettes.
    const names = (block: string) => [...block.matchAll(/(--color-[\w-]+):/g)].map((m) => m[1]).sort();
    const light = names(themeBlock);
    expect(names(darkBlock)).toEqual(light);
    expect(names(printBlock)).toEqual(light);
    expect(light).toHaveLength(COLOUR_TOKENS.length);
  });
```

If this second test fails as written, the spec's existing block helpers are not scoped the way you need them — fix the helper, do not loosen the assertion, and report what you changed.

- [x] **Step 2: Delete the three nested blocks**

1. Inside `.chat-typing-dot`'s neighbourhood: delete the block that sets `.chat-typing-dot { animation: none; transform: none; opacity: 1 }` and `.chat-caret { animation: none }`.
2. After `.reveal[data-visible='true']`: delete the block that sets `.reveal { opacity: 1; transform: none; transition: none }`.
3. After `@keyframes loader-sweep`: delete the block that sets `.loader-bar { animation: none; width: 100% }`.
4. Inside `@supports (animation-timeline: view())`, delete the two-line comment that reads "The hero portrait is a composition anchor: it must sit exactly where the grid puts it, so it keeps the entrance rise and takes no parallax." It was the rationale for the `.portrait-settle` rule Task 2 removed; left in place it sits directly above `.shot-parallax` and contradicts it. Keep the `.shot-parallax` rule and the blank line spacing tidy.

- [x] **Step 3: Extend the surviving block**

The unlayered block below the motion layer is now the only one. It must read exactly:

```css
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  .enter,
  [data-stagger],
  .chat-bubble,
  .chat-panel,
  .chat-typing-dot,
  .reveal,
  .reveal[data-visible='true'] {
    animation: none !important;
    filter: none !important;
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }

  .chat-caret,
  .loader-bar {
    animation: none !important;
  }

  .chat-caret {
    opacity: 1 !important;
  }

  .loader-bar {
    width: 100% !important;
  }

  .edge-top::before {
    animation: none !important;
    transform: none !important;
  }

  .scroll-progress {
    animation: none !important;
    display: none !important;
  }

  .project-shot,
  .shot-parallax,
  .hero-portrait,
  .hero-cta {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
```

Note: `.portrait-settle` is not in this list because Task 2 already deleted it. Do not re-add it.

- [x] **Step 4: Run the tests**

Run: `npm run test:ci`
Expected: PASS, `prefers-reduced-motion` count is 1.

- [x] **Step 5: Verify in the browser**

Open the home page, run `document.documentElement.style.setProperty('--x','1')` is not needed — instead enable the OS reduced-motion setting (Windows: Settings → Accessibility → Visual effects → Animation effects off), reload, then check: the hero is visible (not stuck at `opacity: 0`), the project screenshots do not scale on hover, the progress bar is absent, and the chat typing dots are static.

- [x] **Step 6: Commit**

```bash
git add -- src/styles.css src/design-system.spec.ts
git commit -m "refactor(styles): collapse the reduced-motion overrides"
```

---

### Task 4: One token root and one draw keyframe

`rule-draw` and `scroll-sweep` are byte-identical (`scaleX(0)` → `scaleX(1)`), and motion tokens live in a second `:root` far from the first.

**Files:**
- Modify: `src/styles.css`
- Modify: `src/design-system.spec.ts`

- [x] **Step 1: Write the failing test**

```typescript
  it('keeps one top-level token root', () => {
    expect((css.match(/^:root \{/gm) ?? []).length).toBe(1);
  });
```

Run: `npx vitest run src/design-system.spec.ts`
Expected: FAIL, received 2.

- [x] **Step 2: Move the motion tokens into the main root**

Delete the second `:root` block and add its four declarations to the first one, after `--shadow-panel`:

```css
  /* Motion. Rise is the entrance curve; out is the state curve. Two easings,
     two jobs: `--ease-out` settles an interaction, `--ease-rise` arrives. */
  --ease-rise: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-rise: 700ms;
  --stagger: 60ms;
  --rise-blur: 6px;
```

- [x] **Step 3: Delete the duplicate keyframe**

Delete `@keyframes scroll-sweep`, and change the progress bar's animation to the surviving name:

```css
  @supports (animation-timeline: scroll()) {
    .scroll-progress {
      animation: rule-draw linear both;
      animation-timeline: scroll();
    }
  }
```

Do not set `animation-duration`: for a scroll timeline the initial `auto` maps the duration to the scroll range, and any explicit value would pin the sweep to wall-clock time.

- [x] **Step 4: Run the tests and the build**

Run: `npm run test:ci`
Expected: PASS.

Run: `npm run build`
Expected: exit 0. Then open the home page, scroll, and confirm the 2 px bar across the top of the sticky toolbar grows from the left at the same rate as before.

- [x] **Step 5: Commit**

```bash
git add -- src/styles.css src/design-system.spec.ts
git commit -m "refactor(styles): merge token roots and the draw keyframe"
```

---

### Task 5: Make the type scale available to Tailwind

`--text-*` live in `:root`, so Tailwind generates no `text-meta` / `text-h2` utilities. That is why the mono meta recipe (mono, size, weight, uppercase, `0.08em` tracking) is retyped in seven rules instead of composed. Move the type tokens into `@theme`, add a tracking token and the paired line-height, then replace the copies with `@apply`.

**Files:**
- Modify: `src/styles.css`
- Modify: `src/design-system.spec.ts`

**Interfaces:**
- Produces: theme utilities `text-display`, `text-lead`, `text-h2`, `text-h3`, `text-body`, `text-small`, `text-meta`, `text-metric`, `tracking-meta`.
- Produces: `--text-meta--line-height: 1.4`, which makes `text-meta` set size and leading together.

- [x] **Step 1: Write the failing test**

```typescript
  it('declares the meta type once', () => {
    // Seven rules used to retype mono + 13px + 500 + uppercase + 0.08em.
    // The recipe is a token now; a second literal means it has been copied again.
    expect((css.match(/letter-spacing:\s*0\.08em/g) ?? []).length).toBe(1);
    expect(css).toContain('--tracking-meta: 0.08em');
  });
```

Run: `npx vitest run src/design-system.spec.ts`
Expected: FAIL, received 7.

- [x] **Step 2: Move the type tokens into `@theme`**

Cut these from `:root` and add them to the end of `@theme`, keeping the values verbatim and the explanatory comments that still apply:

```css
  /* Type. Named sizes so the templates and the primitive classes agree, and so
     Tailwind can generate `text-meta` and friends. The 13px floor holds for
     page chrome and for every `.type-*` class. The CV sheet is a document and
     keeps its own scale in `src/app/pages/cv/index.page.css`; it is the one
     place below the floor, and it prints from a pt scale anyway. */
  --text-display: clamp(2.75rem, 1.35rem + 6.2vw, 6rem);
  --text-lead: clamp(1.125rem, 1rem + 0.7vw, 1.5rem);
  --text-h2: clamp(1.875rem, 1.1rem + 2.9vw, 3.25rem);
  --text-h3: 1.125rem;
  --text-body: 1rem;
  --text-small: 0.875rem;
  --text-meta: 0.8125rem;
  --text-meta--line-height: 1.4;
  --text-title: clamp(2rem, 1.2rem + 3.2vw, 3.75rem);
  --text-metric: clamp(2.25rem, 1.4rem + 3vw, 4rem);
  --tracking-meta: 0.08em;
```

`--text-title` is the case-study heading clamp (`.type-title`, used at `src/app/pages/projects/[slug]/index.page.html:27`). Move it with the rest so it becomes `text-title`, but keep the `.type-title` rule and its `font-size: var(--text-title)` declaration as they are — `@theme` still emits the custom property on `:root`, so the rule keeps resolving, and Task 6 re-homes it.

Leave `--container`, `--gutter`, `--space-section`, `--space-section-compact` and `--shadow-panel` in `:root`: they are layout, not type, and `--container` would collide with Tailwind's `--container-*` namespace.

Two more edits while you are in `:root`:

1. **Keep the design rationale, not just the values.** `:root` currently carries three interleaved comments you are moving: the `--text-h2` note ("the page's second voice… at 3.25rem the heading carries the page"), the `--text-title` note ("article titles… the masthead stays the loudest line on the site"), and the 13px-floor note ("12px uppercase mono with wide tracking falls apart at arm's length"). Keep all three inside `@theme`, next to the declarations they explain, in addition to the new `Type.` header. They are the only record of why the clamps are shaped that way.
2. **Fix a stale sentence in the motion comment.** It currently reads "Rise is the entrance curve; out is the state curve. Two easings, two jobs: `--ease-out` settles an interaction, `--ease-rise` arrives." `--ease-out` is declared in `@theme`, not in this `:root`, so a reader of the block sees one easing under a claim of two. Change `--ease-out` to "`--ease-out` (in `@theme` above)" and leave the rest word-for-word.

- [x] **Step 3: Replace the seven copies with `@apply`**

Each rule keeps its non-type declarations. Replace the type declarations in each block with the single `@apply` line shown.

```css
  .type-meta {
    @apply font-mono text-meta font-medium uppercase tracking-meta;
  }
```

```css
  .project-markdown th {
    @apply font-mono text-meta font-medium uppercase tracking-meta;
    color: var(--color-ink-3);
  }
```

```css
  .project-markdown .cell-label {
    display: block;
    margin-bottom: 0.1875rem;
    @apply font-mono text-meta font-medium uppercase tracking-meta;
    color: var(--color-ink-3);
  }
```

```css
  .toolbar-option {
    @apply font-mono text-meta font-medium uppercase tracking-meta;
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
```

```css
  .toolbar-toggle {
    @apply font-mono text-meta font-medium uppercase tracking-meta;
    color: var(--color-ink-3);
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding-block: 0.375rem;
    padding-inline: 0.5rem;
    border: 1px solid transparent;
    border-radius: var(--radius-base);
    background: none;
    transition:
      color var(--dur-fast) var(--ease-out),
      background-color var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out);
  }
```

```css
  .admin-chip {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--color-rule);
    border-radius: var(--radius-base);
    padding: 0.125rem 0.5rem;
    @apply font-mono text-meta uppercase tracking-meta;
    color: var(--color-ink-3);
  }
```

Note the missing `font-medium` here and in the next rule: neither block set a weight before, so adding one would change the rendering. `text-meta` also brings `line-height: 1.4` where `.admin-chip` previously inherited `1.6`; that is the one accepted visual delta in this plan, about 1.6 px on a chip.

```css
  .chat-markdown th {
    @apply font-mono text-meta uppercase tracking-meta;
    color: var(--color-ink-3);
  }
```

`.cv-section-title` keeps `letter-spacing: 0.14em` and `0.6875rem` for now; it moves into the CV stylesheet in Task 8.

- [x] **Step 4: Run the tests and the build**

Run: `npm run test:ci`
Expected: PASS, `letter-spacing: 0.08em` count is 1.

Run: `npm run build`
Expected: exit 0. Tailwind must accept `@apply text-meta ... tracking-meta`; if it reports `Cannot apply unknown utility class`, the token did not land in `@theme` or is misspelled.

**Then check the emitted variables, because a passing build does not prove them.** Tailwind v4 only emits theme variables it considers used, so a `--text-*` moved into `@theme` could be tree-shaken and leave every `font-size: var(--text-display)` resolving to nothing — which no test in this repo would catch, since `design-system.spec.ts` reads the *source*, not the output. Grep the built stylesheet:

```powershell
rg -n -- "--text-(display|lead|h2|title|h3|body|small|meta|metric):" dist/client/assets/ -g '*.css'
```

All nine must appear. If any is missing, mark the block `@theme static` instead of `@theme` (that option forces every variable to be emitted) and rebuild, then re-run the grep. Note `--text-meta--line-height` will *not* appear as its own custom property — it is a sub-property Tailwind consumes when generating `text-meta`, so its absence from the output is correct, not a failure.

- [x] **Step 5: Check the rendering**

Open the home page and the projects index. The toolbar labels, the section eyebrows and the project table headers must look identical: 13 px, mono, uppercase, `0.08em` tracked, 1.4 leading. Open `/admin` and confirm the chips are still legible and only marginally tighter.

- [x] **Step 6: Commit**

```bash
git add -- src/styles.css src/design-system.spec.ts
git commit -m "refactor(styles): compose the meta type from theme tokens"
```

---

### Task 6: Split the stylesheet behind one entry

Move-only task. No rule changes text; if a selector needs editing to move, stop and fix the earlier task instead. Layers are declared once by `@import 'tailwindcss'`, so `@layer components` blocks merge across files and the **import order in the entry is the cascade order**.

**Pre-verified before dispatch (2026-11-15).** Two things this task depends on were checked against the real toolchain and file, so do not re-litigate them, but do report if either turns out false:
1. `@tailwindcss/postcss` (v4.3.5, via `.postcssrc.json`) inlines relative `@import './styles/x.css'` and still emits `@theme static` tokens. A probe of `@import 'tailwindcss'; @import './part.css'; @theme static { --probe-token: 1px }` produced both the imported rule and the token in the output.
2. The import order below moves the unlayered chrome rules (`.skill-grid`, `[data-toolbar-mobile]`, `footer .page-shell`) *before* the general print block, which they currently follow. That reorder is inert because the print block hides chrome with `!important` (`site-toolbar`, `chat-widget`, `.fixed`, `.scroll-progress`, `.tap-area::after`). The `footer .page-shell` print override is *not* in `print.css` — it sits in `chrome.css` with the screen rules it overrides — so nothing later competes with it. Keep every `!important` in the print block exactly as it is; that is what makes the reorder safe.

**Outcome note (task complete in `dbd2875`).** Two cascade regressions appeared in the first attempt of this task and were fixed inside it, which is worth recording because the tests could not see them: `@media` adds no specificity, and custom properties resolve by source order. Because `@import` content is emitted *before* the entry's own rules, the `--gutter: 2.5rem` override (originally in `base.css`) and the print palette (originally in `print.css`) both landed above the entry's `:root` and dark block and were dead — desktop gutters stayed at 1.5rem and, worse, the dark scheme beat the print palette, reintroducing the Task 1 bug. Both now live in the entry in the original order (`@theme` → `:root` → gutter media → dark → print palette), and a precedence test pins that order. `print.css` therefore holds print *rules*, not the palette; its header says so.

**Files:**
- Create: `src/styles/base.css`
- Create: `src/styles/primitives.css`
- Create: `src/styles/chrome.css`
- Create: `src/styles/forms.css`
- Create: `src/styles/overlays.css`
- Create: `src/styles/markdown.css`
- Create: `src/styles/motion.css`
- Create: `src/styles/print.css`
- Create: `src/styles/cv.css` (temporary: deleted in Task 8)
- Modify: `src/styles.css`
- Modify: `src/design-system.spec.ts`

**Interfaces:**
- Produces: `src/styles.css` as an entry containing only `@import` lines, `@theme` and `:root`. The spec's `readStylesheet()` inlines one level of relative `@import`, so every existing text assertion keeps working.

- [x] **Step 1: Write the failing test**

Replace the top-level `const css = readFileSync(...)` with:

```typescript
const entryUrl = new URL('./styles.css', import.meta.url);

/** The entry plus every relative stylesheet it imports, one level deep. */
function readStylesheet(): string {
  const entry = readFileSync(entryUrl, 'utf8');
  return entry.replace(/@import\s+'(\.[^']+)';/g, (_match, relative: string) =>
    readFileSync(new URL(relative, entryUrl), 'utf8'),
  );
}

const css = readStylesheet();
```

Add:

```typescript
  it('keeps the entry to tokens and imports', () => {
    const entry = readFileSync(entryUrl, 'utf8').replace(/@import\s+'[^']+';/g, '').trim();
    expect(entry.length).toBeLessThan(4000);
    expect(entry).not.toContain('.page-shell');
  });
```

Run: `npx vitest run src/design-system.spec.ts`
Expected: FAIL — the entry still holds every rule, so `entry.length` is far above 4000 and it contains `.page-shell`.

- [x] **Step 2: Create the files by moving blocks, not editing them**

Move in this order; every block keeps its comment verbatim.

- `src/styles/base.css` — the `@layer base` block (`html`, `body`, `::selection`, `:focus-visible`, `h1,h2,h3`, `p`, `img`), plus the `@media (min-width: 1024px) { html { scroll-padding-top } }` and `@media (min-width: 768px) { :root { --gutter } }` rules that sit above it. Header: `/* Document element styles. Nothing here is scoped: html, body and the selection colour have no component. */`
- `src/styles/primitives.css` — from `.page-shell` through `.type-metric`, then `.section`, `.section-compact`, `.link-quiet`, `.link-quiet:hover`, `.tap-area`, `.tap-area::after`, `[data-yielded]`. That range includes `.bleed` and `.type-title`, which are live in the case-study template (`src/app/pages/projects/[slug]/index.page.html`) and must be carried over verbatim, not dropped. Header: `/* Shared primitives. Global on purpose: they are used in page templates and in content projected through ng-content, where Angular's emulated encapsulation cannot reach. */`
- `src/styles/chrome.css` — `.toolbar-option` and its states, `.toolbar-toggle` and its states, `.loader-bar`, `@keyframes loader-sweep`, `[data-toolbar-mobile]` and its children rules, `footer .page-shell` and both of its media variants, `.skill-grid`, `.skill-cell`, `.skill-cell[data-span='*']`. Header must state: `/* Site chrome. The phone-nav grid, the footer lane and the skill grid stay unlayered so they beat the flex and width utilities the templates apply; every other rule here belongs to @layer components. */`
- `src/styles/forms.css` — `.field`, `.field::placeholder`, `.chat-panel .field`, `.field:hover`, `.field:focus`, `.field:focus-visible`, `.field[aria-invalid='true']`, `.admin-card`, `.admin-h1`, `.admin-h2`, `.admin-btn`, `.admin-btn:hover`, `.admin-btn-primary`, `.admin-btn-primary:hover`, `.admin-chip`, `.admin-chip[data-live='true']`, `.admin-row`, `.admin-link`, `.admin-link:hover`. Header: `/* Form controls and the admin cards. Global: .field is applied by page templates to inputs they project through form-field, so a component scope would never match it. */`
- `src/styles/overlays.css` — `.zoom-dialog`, `.zoom-dialog::backdrop`, `.zoom-dialog[open]`, `.zoom-dialog-image`, `.chat-typing-dot`, `@keyframes chat-typing-bounce`, `.chat-caret`, `@keyframes caret-blink`, `.chat-launcher`, `.chat-bubble`, `.chat-panel`. Header: `/* Floating surfaces: the zoom dialog and the chat chrome. Global because the launcher lives in the page template and the panel in chat-widget. */`
- `src/styles/markdown.css` — `.project-markdown` and every descendant rule including the table→card media block and the scroll-shadow background, then `.chat-markdown` and every descendant rule. Header: `/* Rendered markdown. This CSS can never be component-scoped: the markup arrives through [safeHtml] as sanitized innerHTML, so it carries no Angular scope attribute. */`
- `src/styles/motion.css` — `@keyframes rise-in`, `rule-draw`, `message-in`, `shot-drift`, then `.enter`, `.reveal [data-stagger]`, `.reveal[data-visible='true'] [data-stagger]`, `.edge-top`, `.edge-top::before`, its reveal rule, `.scroll-progress` and its `@supports`, `.project-row` and its hover, `.portrait`, `.project-shot` and its hover, `.project-row:first-child` and its media variant, the `@media (hover: hover)` `.hero-cta` block, the `@supports (animation-timeline: view())` block, and the single reduced-motion block — which must stay **last in the file**. Header: `/* Motion. One reduced-motion block, at the end, so it wins by source order inside the layer and by being unlayered against everything else. */`
- `src/styles/print.css` — the `@media print` palette block from Task 1, the chrome/`opacity`/`break-inside`/`a`/`img`/`.zoom-dialog` rules, and the `@page` rule. Leave the CV rules out; they go to `cv.css`. Header: `/* Print. Unlayered on purpose: print rules must beat utilities and cannot sit in a component stylesheet. @page has to be top level and global. */`
- `src/styles/cv.css` — the entire `/* CV */` section, screen and print, moved verbatim. Header: `/* CV, temporary home. Moves to src/app/pages/cv/index.page.css in Task 8. Imported last so its print block still follows the general print block, which is the order it has today. */`

Keep `.reveal` and `.zoom-dialog` in their new homes even though their neighbours moved elsewhere.

- [x] **Step 3: Reduce the entry**

`src/styles.css` becomes exactly:

```css
@import 'tailwindcss';

@import './styles/base.css';
@import './styles/primitives.css';
@import './styles/chrome.css';
@import './styles/forms.css';
@import './styles/overlays.css';
@import './styles/markdown.css';
@import './styles/motion.css';
@import './styles/print.css';
@import './styles/cv.css';

@theme {
  /* existing @theme body, unchanged from Task 5 */
}

:root {
  /* existing :root body, unchanged from Task 5 */
}
```

`cv.css` is imported last so its print block still follows the general print block, which is the order it has in the single file today. `@page` must already live in `print.css`; do not duplicate it, and do not leave a copy in the entry.

The `:root` block stays in the entry, so the `@media (min-width: 768px) { :root { --gutter } }` rule must move to `base.css` while `@media (prefers-color-scheme: dark)` stays in the entry next to the light palette. Do not separate a token override from the token block it overrides without saying so in the report.

One pre-existing oddity to carry unchanged: the `.cv` rule is dedented to column 0 inside what looks like a `@layer components` body. Layers are brace-based, so it is still layered. Move it verbatim with its current indentation; do not "fix" it. It gets fixed in Task 8 when the CV styles leave.

- [x] **Step 4: Run the tests**

Run: `npm run test:ci`
Expected: PASS. Every previous text assertion now reads the concatenation. If a `.chat-markdown ul { list-style: disc }` assertion fails, `markdown.css` is not imported or the rule was left behind.

Run: `npm run build`
Expected: exit 0. Compare the emitted `dist/client/assets/*.css` size with the previous build; the difference must be under 1 KB (concatenation and import inlining only). If the CSS grew noticeably, a block was duplicated.

- [x] **Step 5: Check the cascade by eye**

Load these five views and compare with a screenshot taken before this task: home at 375 px and 1280 px, the CV at 1280 px, a case-study page, and the chat open. Specifically confirm the phone nav is still two columns (`[data-toolbar-mobile]` is grid, not flex), the footer links still clear the launcher, and the skill hairline grid still fills three rows with no empty cell.

- [x] **Step 6: Commit**

```bash
git add -- src/styles.css src/styles src/design-system.spec.ts
git commit -m "refactor(styles): split the stylesheet into owned files"
```

---

### Task 7: Derive the scroll offset from the measured header

`scroll-padding-top` is hardcoded at `9rem` below 1024 px and `4.75rem` above, while `site-toolbar.ts` already measures the real height and reports it to `ViewportScroller`. The CSS values only win today because they are unlayered; the measurement is the truth.

**Files:**
- Modify: `src/styles/base.css`
- Modify: `src/app/shared/components/site-toolbar/site-toolbar.ts:1-40`
- Modify: `src/design-system.spec.ts`

**Interfaces:**
- Produces: `--header-offset` on `document.documentElement`, a px string, set after first render and on every resize of the toolbar. Consumed by `html { scroll-padding-top: var(--header-offset, 9rem) }`.

- [x] **Step 1: Write the failing tests**

```typescript
  it('takes scroll padding from the measured header', () => {
    expect(css).toMatch(/scroll-padding-top:\s*var\(--header-offset,\s*9rem\)/);
    expect(css).not.toMatch(/scroll-padding-top:\s*\d/);
    // The desktop override must be gone, not merely reworded. `base.css` used to
    // carry an unlayered `@media (min-width: 1024px) { html { scroll-padding-top } }`
    // that only beat the layered rule because unlayered CSS wins; once the value
    // is measured, a second hardcoded one is both redundant and wrong.
    expect((css.match(/scroll-padding-top/g) ?? []).length).toBe(1);
  });
```

Run: `npx vitest run src/design-system.spec.ts`
Expected: FAIL — two literal `scroll-padding-top` declarations remain.

- [x] **Step 2: Change the CSS**

In `src/styles/base.css`, delete the whole `@media (min-width: 1024px) { html { scroll-padding-top: 4.75rem } }` rule and change the base rule:

```css
  html {
    background: var(--color-paper);
    /* Measured by site-toolbar.ts and written to :root. The fallback is the
       tallest phone header, used only before the first measurement. */
    scroll-padding-top: var(--header-offset, 9rem);
    scroll-behavior: smooth;
  }
```

- [x] **Step 3: Write the offset in the toolbar**

Replace the `afterNextRender` block and `ngOnDestroy` in `site-toolbar.ts` with:

```typescript
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const apply = () => {
        const height = this.host.nativeElement.offsetHeight;
        document.documentElement.style.setProperty('--header-offset', `${height}px`);
        this.scroller.setOffset([0, height]);
      };
      apply();
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      this.resizeObserver = new ResizeObserver(apply);
      this.resizeObserver.observe(this.host.nativeElement);
      // Registered inside the render callback, so teardown only ever exists in
      // the browser. `ngOnDestroy` would run during server rendering too, where
      // `document` is not defined and touching it throws.
      this.destroyRef.onDestroy(() => {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        document.documentElement.style.removeProperty('--header-offset');
      });
    });
  }
```

`afterNextRender` and the observer callback only run in the browser, so `document` is safe under SSR. The property goes on `documentElement`, not on the host: `scroll-padding-top` is declared on `html` and cannot read a variable scoped to a descendant.

**Do not keep a plain `ngOnDestroy` that touches `document`.** `ngOnDestroy` runs during server-render teardown as well, so `document.documentElement` would throw `ReferenceError: document is not defined` in the SSR path. `DestroyRef.onDestroy` registered inside `afterNextRender` cannot run on the server because the callback that registers it never does. Drop `OnDestroy` from the class's `implements` list and remove the `ngOnDestroy` method; add `DestroyRef` to the `@angular/core` import.

The removal on teardown means a route without a toolbar falls back to `9rem`. That is safe: every `href="#…"` in the app lives in `index.page.html`, `footer.html` and `masthead.html`, all of which render on the home page, the one page that owns a `site-toolbar` (`rg -n 'href="#' src/app -g '*.html'` and `rg -n 'site-toolbar' src/app -g '*.html'` to confirm). If a future page adds in-page anchors without a toolbar, it should set its own fallback rather than inherit the phone header's 9rem.

- [x] **Step 4: Run the tests**

Run: `npm run test:ci`
Expected: PASS.

Run: `npm run typecheck`
Expected: exit 0.

- [x] **Step 5: Verify the anchors**

Serve with `npm run dev`. At 375 px, click every toolbar anchor: the section heading must land clear of the sticky bar with no extra gap. Toggle the dev-mode persona buttons (they only appear at `sm` and above) to change the header height, then click an anchor again: the offset must follow. Repeat at 1280 px. Then resize the window and click again without reloading.

- [x] **Step 6: Commit**

```bash
git add -- src/styles/base.css src/app/shared/components/site-toolbar/site-toolbar.ts src/design-system.spec.ts
git commit -m "fix(toolbar): measure the sticky offset instead of guessing"
```

---

### Task 8: Give the CV its own stylesheet

The CV block is the only part of the file that meets all four scoping criteria: the markup is authored in `index.page.html`, nothing is projected, nothing is injected, and no other component uses `.cv-*`. It is ~200 lines of screen rules plus ~130 lines of print rules that currently duplicate every property.

**Files:**
- Create: `src/app/pages/cv/index.page.css`
- Modify: `src/app/pages/cv/index.page.ts:16-22`
- Delete: `src/styles/cv.css` and its `@import` line in `src/styles.css`
- Modify: `src/styles/print.css` (only if a `.cv-*` rule was left there in Task 6)
- Modify: `src/design-system.spec.ts`

**Interfaces:**
- Consumes: `--color-*` tokens from the global `:root`; those resolve inside a component stylesheet because custom properties inherit through the shadow boundary emulation.
- Produces: `.cv-*` selectors scoped to `[_ngcontent-cv]`. `@page` remains global.

- [x] **Step 1: Write the failing tests**

```typescript
describe('component styles', () => {
  const cvCss = readFileSync(new URL('./app/pages/cv/index.page.css', import.meta.url), 'utf8');
  const cvComponent = readFileSync(new URL('./app/pages/cv/index.page.ts', import.meta.url), 'utf8');

  it('scopes the CV sheet to the CV page', () => {
    expect(cvCss).toContain('.cv-sheet');
    expect(css).not.toContain('.cv-sheet');
    // Wrapped in the components layer, or the unlayered component CSS would beat
    // the Tailwind utilities on the same elements. Same lesson as Task 6.
    expect(cvCss).toMatch(/@layer components\s*\{/);
  });

  it('wires the component stylesheet', () => {
    // Task 6's failure mode one level down: a stylesheet that exists but is
    // never referenced contributes nothing, and every assertion above still passes.
    expect(cvComponent).toContain("styleUrl: './index.page.css'");
  });

  it('keeps the page box global', () => {
    // @page is document-level and outlives the route; a component stylesheet
    // would leave A4 margins on every print afterwards.
    expect(css).toMatch(/@page\s*\{/);
    expect(cvCss).not.toMatch(/@page\s*\{/);
  });
});
```

Two details that will otherwise bite you:

- The last assertion is `not.toMatch(/@page\s*\{/)`, **not** `not.toContain('@page')`. The header comment this task tells you to write mentions `@page` by name, so a substring check would fail on your own comment. Match the at-rule, not the word.
- The file is read at module scope inside the `describe` body, which vitest evaluates during collection, so a missing file fails the run rather than a single test. That is the intended red state.

Run: `npx vitest run src/design-system.spec.ts`
Expected: FAIL — `index.page.css` does not exist, so the read throws.

- [x] **Step 2: Move the screen rules**

Create `src/app/pages/cv/index.page.css` containing the whole CV section from `src/styles/cv.css`, wrapped in the components layer:

```css
/* The CV is the only component that owns its styles.
   Criteria, all four true: the markup is authored in this template, nothing
   is projected through ng-content, nothing arrives as sanitized innerHTML,
   and no other component uses a .cv-* class.
   Wrapped in @layer components so utilities can still override it. @page and
   the document-level print resets stay in src/styles/print.css. */

@layer components {
  .cv-sheet {
    width: 100%;
    max-width: 210mm;
    margin-inline: auto;
    padding: 2rem 1.375rem;
    background: var(--color-surface);
    border: 1px solid var(--color-rule);
  }

  /* ...every rule from .cv-name through .cv-language-level, unchanged... */

  @media (min-width: 640px) {
    .cv-sheet {
      padding: 3rem 2.5rem;
    }

    .cv-skill {
      grid-template-columns: 11rem minmax(0, 1fr);
    }
  }

  @media print {
    .cv-chrome {
      display: none !important;
    }

    .cv-sheet {
      max-width: none;
      padding: 0;
      background: none;
      border: 0;
    }

    /* ...every .cv-* print rule, unchanged: the pt sizes, the 30 mm skill
       column, and the break-inside and break-after rules... */
  }
}
```

Copy the rules verbatim from the entry; do not retune a single value in this task. The screen `rem` sizes and the print `pt` sizes both move as they are.

**`main#main` stays global — do not move it into the component.** `src/styles/cv.css:213` has, inside its `@media print`, a `main#main { padding: 0 !important; background: var(--color-paper) !important }` rule. It is not a `.cv-*` selector and it is not CV-specific: it is a document-level reset for any printed page. Three reasons it belongs in `src/styles/print.css` instead:

1. It is only CV-shaped by accident of where it was written. Moving it into the component scopes it to `main#main[_ngcontent-cv]`, which stops it applying to every other printed page — a visual change to `/projects`, `/admin`, the lot. This task is a move, not a print redesign.
2. The header comment you are told to write says "the document-level print resets stay in `src/styles/print.css`". Putting this rule in the component would contradict the file's own charter.
3. It has `!important` because `main#main` carries `pt-8 pb-16` utilities; that reason holds on every page, not just the CV.

So: delete it from the moving block and add it verbatim to the existing `@media print` block in `src/styles/print.css`. Behaviour is then identical for every page, including the CV.

- [x] **Step 3: Delete the moved CSS and wire the component**

Delete `src/styles/cv.css` and its `@import './styles/cv.css';` line from `src/styles.css`. There are **no** `.cv-*` rules in `src/styles/print.css` today (verified: every one lives in `cv.css`), so that part of this step is a no-op — confirm it with `rg -n '\.cv-[a-z]' src/styles/` rather than assuming. What `print.css` must gain is the `main#main` reset described above.

Keep in `print.css`: `main#main` (moved in), the blanket `a` rule, the `article/li/.admin-card/figure/.project-markdown` break rules, `h1,h2,h3 { break-after: avoid }`, `img`, `.zoom-dialog`, and `@page`.

Also confirm `.cv` — the nav-link class, not a CV-page class — stays in `src/styles/chrome.css` and is untouched. It styles the toolbar and footer links and must never end up in the component stylesheet, which cannot reach them.

Add `styleUrl` to the component metadata:

```typescript
@Component({
  selector: 'cv-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './index.page.html',
  styleUrl: './index.page.css',
})
```

- [x] **Step 4: Run the tests and the build**

Run: `npm run test:ci`
Expected: PASS.

Run: `npm run build`
Expected: exit 0. The component stylesheet is emitted with the CV route chunk; the global CSS should shrink by several KB. Run `git diff -M` on the commit and confirm every `.cv-*` line reads as moved, not modified — a changed value in this task is out of scope.

Verify the component CSS actually reached the browser bundle rather than being dropped as unused: `rg -l 'cv-sheet' dist/client/assets/` must list at least one file. Then confirm the global bundle still carries `main#main` in its print block and no longer carries any `.cv-` selector except the nav `.cv`.

- [x] **Step 5: Verify screen and print**

Open `/cv` at 375 px and 1440 px: the sheet must be 210 mm wide, centred, with the hairline border and the same type sizes as before. Press Ctrl+P: no sheet card, no toolbar, no print button, margins 11 mm × 14 mm, the section rules intact, and no entry split across pages. Then navigate from `/cv` to `/projects` and press Ctrl+P again to confirm the A4 page box is the only thing that persists — which is intended, since `@page` went global, not scoped.

- [x] **Step 6: Commit**

```bash
git add -- src/app/pages/cv/index.page.css src/app/pages/cv/index.page.ts src/styles.css src/styles/cv.css src/styles/print.css src/design-system.spec.ts
git commit -m "refactor(cv): move the CV styles into its component"
```

---

### Task 9: Write the policy down

The organising rule currently lives only in the code. Without it, the next contributor will either scope `.field` (which cannot work) or add an unlayered rule (which silently beats utilities).

**Files:**
- Modify: `src/styles.css` (header comment)
- Create: `docs/superpowers/specs/2026-11-15-stylesheet-architecture.md`
- Modify: `docs/superpowers/plans/2026-11-15-stylesheet-architecture.md` (tick the boxes)

- [x] **Step 1: Put the rule at the top of the entry**

```css
/* ---------------------------------------------------------------------------
   Stylesheet entry

   Import order is cascade order: base, primitives, chrome, forms, overlays,
   markdown, motion, print. Layers are declared once by `tailwindcss`, so
   `@layer components` blocks merge across files.

   Where a rule goes, in this order:
   1. Utility, when one already says it. Layout, spacing, colour, one-off widths.
   2. `src/styles/*.css`, when it is a recipe used by more than one component
      (the type scale, .field, the toolbar, markdown). Global because Angular's
      emulated encapsulation cannot style projected `ng-content` or sanitized
      `innerHTML`, and these primitives are used through both.
   3. A component `styleUrl`, only when all four hold: the markup is authored in
      that template, nothing is projected, nothing is injected as innerHTML, and
      no other component uses the class. Today only the CV qualifies.
   4. This file, only for tokens: `@theme` and `:root`. It is the palette
      contract that `src/design-system.spec.ts` reads, so tokens live here rather
      than in `src/styles/`.

   Unlayered on purpose, and only these: `[data-toolbar-mobile]`, `footer
   .page-shell`, `.skill-grid`, `.skill-cell` (they must beat the flex and width
   utilities), the reduced-motion block, and `@media print`. Anything else that
   leaves a layer is a bug: unlayered beats every Tailwind utility.
--------------------------------------------------------------------------- */
```

- [x] **Step 2: Write the spec document**

Create `docs/superpowers/specs/2026-11-15-stylesheet-architecture.md` with four sections, in the house voice: **What lives where** (the nine files and one component stylesheet, with what each owns), **Why not component styles for everything** (the three structural blockers: `_ngcontent` on projected content, no scope attribute on `safeHtml` output, unlayered component CSS beating utilities — each with the file that proves it), **Why not utilities for everything** (the attribute-state selectors, pseudo-elements, `::backdrop`, `@page`, the print pt scale, the container query in `messages.page.css`), and **The four criteria for scoping** with the CV as the worked example. No code beyond short selector examples.

- [x] **Step 3: Run the full gate**

Run: `npm run verify`
Expected: lint, three `tsc` passes and `vitest run` all pass.

Run: `npm run format:check`
Expected: no unmatched files. If it reports `styles.css` or a new stylesheet, run `npm run format` and amend the commit.

Run: `npm run build`
Expected: exit 0.

- [x] **Step 4: Walk the manual checklist**

Light and dark schemes, each at 375 px and 1280 px:

1. Home: hero portrait shadow, toolbar labels, the progress bar sweeping, section hairline drawing on scroll.
2. Projects index and one case study: the table card layout below 768 px, the scroll-shadow only while the table overflows.
3. Admin: a chip (now 1.4 leading), a primary button hover, a field in error state.
4. Chat: open, send, code block and table in the answer.
5. `/cv`: screen sheet and Ctrl+P preview.
6. Dark scheme, print `/cv` and the home page, check the accent is `#c0430f` on paper and not `#ff8350`.

- [x] **Step 5: Commit**

```bash
git add -- src/styles.css docs/superpowers/specs/2026-11-15-stylesheet-architecture.md docs/superpowers/plans/2026-11-15-stylesheet-architecture.md
git commit -m "docs(styles): record where a rule belongs"
```

---

## Deferred, and why

These are real findings that this plan deliberately does not touch. Each is small, none is a regression, and each needs its own review.

- **Deduplicating the CV's screen and print property sets with `--cv-*` variables.** It would collapse about forty rules, but it replaces a readable pt document scale with a wall of variable indirections, and the only way to verify it is a print preview. Once the CV lives in its own file the duplication is contained; revisit if the CV ever changes twice in one quarter.
- **The 6 px overlap above `.tap-area::after`.** It can intercept a click on the element above in a tight row. The fix is a `top: 0` plus a taller `min-height`, which needs a look at every `tap-area` call site.
- **Hover states not gated by `@media (hover: hover)`.** `.project-row`, `.toolbar-option`, `.admin-btn`, `.admin-link`, `.link-quiet` and `.field` all fire on touch. Gating them changes the phone experience and wants a device check.
- **`.admin-btn` at ~40 px and `.admin-chip` below the 44 px target.** Raising them changes admin density.
- **The table scroll-shadow fading with `var(--color-paper)`.** Correct today because every markdown table sits on paper. It breaks if a table is ever rendered inside `.admin-card`.
- **1 px hairline gaps in `.skill-grid` under fractional Windows scaling.** Needs a screenshot at 125 % and 150 % to decide between `gap: 1px` and a border-based grid.
- **`.cv-*` sizes below the 13 px floor** (11 px, 12 px, 13.5 px). Documented as an exemption in Task 5. Retuning would change the on-screen sheet to fix a number nobody reads.
- **The `.cv-list li` value `0.8438rem`**, which looks like a typo for `0.8125rem`. Changing it would move the printed CV by a fraction of a point; it belongs with a real CV revision.

---

## Self-review notes for the executor

- Task 2 must run before Task 3: Task 3's selector list no longer names `.portrait-settle`, and Task 3 deletes the reduced-motion blocks that still reference it.
- Task 5 must run before Task 6: after the split, `@theme` stays in the entry, and `@apply` in a moved file needs the token to exist first.
- Task 6 is the only task where a wrong edit is invisible to the tests but visible on screen — do the visual pass before committing, not after.
- Task 8 assumes Task 6 left the CV in `src/styles/cv.css`. If Task 6 does not run, move the CV block straight from the original file and skip the temporary file.
- Never move `.field`, `.toolbar-option`, `.project-markdown` or `.chat-markdown` into a component stylesheet. Task 9's spec document says why; the tests will not catch it, the rendering will break silently.
