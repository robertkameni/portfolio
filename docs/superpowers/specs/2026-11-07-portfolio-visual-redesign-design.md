# Portfolio Visual Redesign: "Dossier"

Date: 2026-11-07
Status: Approved for implementation

## 1. Problem

The current public site reads as a hacker-terminal dashboard applied to a CV. Measured from the live page at 1478x745:

- **Palette.** Four hue families. Pure `#000000` page with green-tinted surfaces (`#051408`, `#0a2912`, `#020a04`), green borders (`#143c1a`, `#0f2e15`), emerald `#22c55e`, and stock Tailwind slate text (`oklch(0.872 0.01 258.338)`, `oklch(0.707 0.022 261.325)`) whose cool blue cast fights the green surfaces. The dev toolbar adds blue and purple, so three accents appear above the fold.
- **Type.** `Inter` + `Fira Code`. Inter bold 700 carries every heading. Fira Code appears on 10 nodes only, so it reads as decoration rather than a system.
- **Scale.** H1 96px, hero H2 60px, then section H2s at 30px and 36px. Section headings disagree with each other and the hero outranks every section. 35 text nodes are 14px.
- **Rhythm.** Every section uses `py-4 md:py-6`. Section boundaries land at 361, 920, 1432, 1986, 2306: identical gaps, so nothing groups.
- **Repetition.** Twelve elements at `#051408`, twelve at `#0a2912`. Hero is 2 cards, skills is 6 cards, about is a glass card, contact is a card, projects are cards.
- **Radii.** `12px`, `16px`, `8px`, `6px`, and `9999px` on 16 elements.
- **Gimmicks.** Alternating green/white letters in the 96px name, a pulsing dot before `DEV · LIVE`, a `tracking-[0.3em]` uppercase eyebrow that is also the page's only sub-4.5:1 contrast failure (4.34:1).
- **Mobile.** Dev toolbar is 218px tall at 390px wide (26% of the viewport). Hero block is 1028px tall. Document is 4639px.
- **Dead code.** The `body` radial gradients and diagonal stripes in `styles.css` never render because `main` paints `bg-background` over them.
- **Defects.** `gap12` in `site-toolbar.html` is not a Tailwind class. `overflow-y-contains` in `chat-widget.html` is not a Tailwind class. `link-color-primary-hover` requires `!important`. Contact inputs use placeholders as labels.

## 2. Design read

A personal CV/portfolio for a Technical Lead Frontend, read first by German enterprise recruiters and second by founders, currently dressed as a hacker-terminal dashboard. It should read as a precise printed document that happens to be a website.

Dials: `DESIGN_VARIANCE 6`, `MOTION_INTENSITY 4`, `VISUAL_DENSITY 3`.

Accent: signal orange. It behaves like a proof mark or redline on paper, which suits a document and is rare in this category. It also removes the accidental association between the site and a terminal.

## 3. Non-goals

- No change to information architecture, routes, slugs, or anchors. `/`, `/projects`, `/projects/[slug]`, `/admin/*` stay as they are.
- No change to copy voice, except new section headings and form labels listed in section 9.
- No change to the profile data model. `iconPath` and the adaptive founder/recruiter/developer content stay.
- No change to persistence, analytics events, `trackBehavior` names, or form field names.
- No new component library. Tokens plus Tailwind utilities only.

## 4. Tokens

All tokens live in `src/styles.css` under `@theme`, with dark values applied through a `@layer base` block that swaps custom properties. Tailwind v4 utilities consume the `--color-*` names.

### 4.1 Colour

| Token | Light | Dark |
| --- | --- | --- |
| `--color-paper` | `#f1f2f2` | `#141516` |
| `--color-paper-2` | `#e9eaea` | `#101112` |
| `--color-surface` | `#fafafa` | `#1b1d1e` |
| `--color-ink` | `#101113` | `#eceded` |
| `--color-ink-2` | `#4c5054` | `#a8adb0` |
| `--color-ink-3` | `#63686d` | `#858a8d` |
| `--color-rule` | `#d6d8d9` | `#2c2f31` |
| `--color-accent` | `#c0430f` | `#ff8350` |
| `--color-accent-wash` | `#f7e9e2` | `#2a1a13` |

Semantic aliases kept for backwards compatibility with existing templates: `--color-background` maps to `paper`, `--color-primary` maps to `accent`.

(`#cf4a16` was the first candidate. It measures 4.03:1 on this paper, so it fails. `#c0430f` is the corrected value.)

Contrast, computed from relative luminance:

- ink on paper: 15.4:1
- ink-2 on paper: 7.25:1
- ink-3 on paper: 4.94:1
- accent on paper: 4.62:1
- paper text on accent fill: 4.62:1
- accent on dark paper: 7.54:1

Dark-mode tokens use `dark:`-free semantic utilities, so no `@custom-variant` is required. The token swap happens on `:root` inside `@media (prefers-color-scheme: dark)`.

`ink-3` is restricted to text at or above 16px, or to non-essential metadata that is duplicated elsewhere. Anything smaller uses `ink-2`.

### 4.2 Type

Families, self-hosted through `@fontsource-variable/instrument-sans` and `@fontsource-variable/jetbrains-mono`, imported in `styles.css`:

```
--font-sans: 'Instrument Sans Variable', ui-sans-serif, system-ui, sans-serif;
--font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;
```

`Inter` and `Fira Code` are removed from the `@theme` block. No `<link>` to Google Fonts.

Steps:

| Token | Value | Weight | Tracking | Line height |
| --- | --- | --- | --- | --- |
| `--text-display` | `clamp(2.75rem, 1.35rem + 6.2vw, 6rem)` | 600 | `-0.03em` | 0.95 |
| `--text-lead` | `clamp(1.125rem, 1rem + 0.7vw, 1.5rem)` | 500 | `-0.01em` | 1.4 |
| `--text-h2` | `clamp(1.6rem, 1.2rem + 1.7vw, 2.5rem)` | 600 | `-0.02em` | 1.1 |
| `--text-h3` | `1.0625rem` | 600 | `0` | 1.4 |
| `--text-body` | `1rem` | 400 | `0` | 1.65 |
| `--text-small` | `0.875rem` | 400 | `0` | 1.55 |
| `--text-meta` | `0.75rem` | 500 | `0.08em` | 1.4 |
| `--text-metric` | `clamp(2rem, 1.4rem + 2.4vw, 3.5rem)` | 600 | `-0.03em` | 1 |

`--text-meta` is always uppercase and always mono. Numerals in dates, years, and metrics use `font-variant-numeric: tabular-nums`.

### 4.2.1 Component classes

Rather than repeat four arbitrary-value utilities per heading, `styles.css` defines one class per step. Templates use these instead of raw `text-*` sizing.

```css
.type-display { font-size: var(--text-display); line-height: 0.95; font-weight: 600; letter-spacing: -0.03em; color: var(--color-ink); }
.type-lead    { font-size: var(--text-lead);    line-height: 1.4;  font-weight: 500; letter-spacing: -0.01em; }
.type-h2      { font-size: var(--text-h2);      line-height: 1.1;  font-weight: 600; letter-spacing: -0.02em; color: var(--color-ink); }
.type-h3      { font-size: var(--text-h3);      line-height: 1.4;  font-weight: 600; color: var(--color-ink); }
.type-meta    { font-family: var(--font-mono); font-size: var(--text-meta); line-height: 1.4; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; }
.type-metric  { font-size: var(--text-metric);  line-height: 1;    font-weight: 600; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
```

`.toolbar-option` and `.field` follow the same pattern and are defined in the tasks that introduce them.

The fluid `clamp()` overrides currently assigned to Tailwind's `--text-xs`…`--text-8xl` are removed, so those utilities return to their default values and stay usable inside admin tables and forms. The public type system is carried by `.type-*` component classes (section 4.2.1), not by overriding Tailwind's scale.

### 4.3 Space

```
--container: 78rem;
--gutter: 1.5rem;        /* 2.5rem from md */
--space-section: clamp(4rem, 5vw, 6rem);
--space-block: clamp(2rem, 3vw, 3rem);
```

Section paddings are assigned per section rather than globally, see section 6.

### 4.4 Radii

`--radius: 2px`, applied to buttons, inputs, cards, chat bubbles, and the chat plate. No `rounded-full`, no `rounded-lg` in the public surface. Circles survive only for the chat avatar initials and avatar images, which are inherently circular.

### 4.5 Motion

```
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--dur-fast: 150ms;
--dur-base: 220ms;
--dur-reveal: 600ms;
--reveal-distance: 12px;
```

## 5. Base layer

```css
@layer base {
  html { background: var(--color-paper); }
  body {
    background: var(--color-paper);
    color: var(--color-ink-2);
    font-family: var(--font-sans);
    font-size: var(--text-body);
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }
  ::selection { background: var(--color-accent); color: var(--color-paper); }
  :focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
  h1, h2, h3 { color: var(--color-ink); text-wrap: balance; }
  p { text-wrap: pretty; }
}
```

A skip link to `#main` is added at the top of `index.page.html`. It is visually hidden until focused.

## 6. Composition

Page order is unchanged: masthead, focus, stack, about, projects, contact, footer. `intro` and `hero` merge into a single `masthead` component; the two hero cards move into a new `focus` component. `skills-bento` keeps its selector and is restyled, not renamed, to limit churn.

### 6.1 Masthead

Replaces `intro` and `hero`. Asymmetric grid, `7fr / 4fr` at `lg`, single column below `md`.

Elements, exactly four:

1. `display` name, max two lines, `ink`.
2. `lead` role line (`Technical Lead Frontend Specialist`), `ink-2`.
3. Description, `body`, `ink-2`, clamped to 20 words in copy, `max-w-[46ch]`.
4. Social links, `meta` mono text (`LinkedIn` / `Xing`), `accent` on hover with a 1px underline offset.

Portrait: 4:5 aspect, `object-cover`, `grayscale` at rest, `grayscale-0` on hover, no border, no card, no shadow, `sizes="(min-width: 1024px) 30vw, 100vw"`.

Padding: `pt-16 pb-20`.

The alternating-letter treatment and the `whitespace-pre` hack are removed.

### 6.2 Focus

The two adaptive cards (Frontend / Backend and Quality) become two columns divided by a `border-l` on the second column at `md`, gap `--space-block`. No background, no border box.

Section header: `h2` reading the new `focus.title` copy key. No eyebrow above it.

Per column:

- mono `meta` label (`FRONTEND`, `BACKEND & QUALITY`)
- tech line in `small` mono, `ink-3`
- description in `body`, `ink-2`
- a `divide-y divide-rule` list of three items: title in `h3`-weight sans inline with the description in `body`, no icons, no checkmarks

Padding: `py-16`, `border-t border-rule`.

### 6.3 Stack

`skills-bento` restyled as a specimen grid: `grid-cols-2 md:grid-cols-3`, cells separated by 1px `rule` lines achieved with `gap-px bg-rule` on the wrapper and `bg-paper` on each cell. Each cell: name in sans 500 at `1rem`, `ink`, plus nothing else. No icon, no hover colour change on the cell; hover only darkens the name to `ink`.

Section header: `h2` using the existing `skills.title`, plus one mono `meta` eyebrow above it (`stack.eyebrow`). This is the only eyebrow on the page.

Padding: `py-16`, no rule above (it groups with Focus).

### 6.4 About

Grid `7fr / 4fr` at `md`.

Left: `h2` heading, then paragraphs at `max-w-[62ch]` in `body`/`ink-2`, first paragraph's first line not specially treated. The expand/collapse control becomes a mono `meta` link with a trailing arrow, `accent`, `aria-expanded` set.

Right rail, separated by `border-l border-rule` and `pl-8` at `md`:

- `50%` in `--text-metric`, `accent`, followed by a `small` `ink-2` caption reading "faster team delivery at DATEV"
- three capability blocks separated by `border-t border-rule`, each an `h3` in `ink` plus one line of `small` `ink-2`

No glass, no blur, no card, no icons.

Padding: `py-24`, `border-t border-rule`.

### 6.5 Projects

Section header: `h2` plus a `meta` mono link to `/projects` on the right. The `tracking-[0.3em]` eyebrow is removed, since Stack already owns the page's single eyebrow.

List, not grid. Each project is a `<article>` row:

```
grid md:grid-cols-[1fr_auto] items-baseline gap-x-8
title (h3, ink)                     year (meta mono, ink-3, tabular-nums)
tags (meta mono, ink-3, separated by " · " max one dot per line)
description (body, ink-2, max-w-[65ch])
link (meta mono, accent) with arrow that translates 2px on hover
```

Sections separated by `border-t border-rule` on each article, with the last article carrying `border-b`; row padding `py-6`. Hover: title goes to `accent`, arrow translates.

Cover images are not rendered in this list. Project identity is carried by the title and tags.

Empty state: one row, `body` `ink-2`, reading the existing `copy().projects.empty` string, plus the `meta` link to `/projects`. No bordered box.

Error and loading states: a single `small` line in `ink-3`, no card.

Padding: `py-20`, `border-t border-rule`.

### 6.6 Contact

Grid `5fr / 7fr` at `md`, gap `--space-block`, no card, no border box.

Left column: `h2`, one-sentence description in `body`, then the three `features` as a `divide-y divide-rule` list where each row is the title in `h3` weight and the description in `small` `ink-2`. Icons removed.

Right column, the form:

- Each field is a label above the input. Labels are `meta` mono, `ink-3`, with `for`/`id` wired.
- Inputs and textarea: transparent background, `border-b border-rule`, `py-3`, no side or top border, `focus:border-accent`. Text `ink`, placeholder `ink-3`.
- Submit button: `bg-accent text-paper`, `rounded-[2px]`, `px-6 py-3`, `w-auto` at `md` and `w-full` below, hover darkens the accent 8%, `active:translate-y-px`, `disabled:opacity-50`.
- Error text: `small` `accent`, below the field.
- Success and error use the existing `status-alert` component, restyled to a hairline-bordered row with an accent left border.

Padding: `py-24`, `border-t border-rule`.

### 6.7 Footer

Single row, `meta` mono `ink-3`, `border-t border-rule`, `py-8`, container-aligned. Copy `© 2026 Robert Kameni`. The `h-18` arbitrary height is removed.

### 6.8 Toolbar

Height 52px at every breakpoint. `sticky top-0 z-40`, `bg-paper/90`, `backdrop-blur-md`, `border-b border-rule`.

- Left: mono wordmark `RK` at `0.8125rem`, weight 600, `ink`, links to `/`.
- Middle: profile switcher, only rendered when `devMode`. Each option is a `meta` mono button in `ink-3`; the active one is `ink` with a 2px `accent` underline via `border-b-2`. `aria-pressed` on each. Hidden below `sm`.
- Right: admin button as `meta` mono text in `ink-2`, no filled background.

The pulsing dot, the `DEV · LIVE` uppercase tracking, and the green/blue/purple pills are removed. The `gap12` typo is fixed by deleting the class with the error.

Mobile: single row, only wordmark and admin.

### 6.9 Chat

Launcher: rectangular plate, `rounded-[2px]`, `bg-ink text-paper`, `px-4 py-2.5`, mono `meta` label `ASK THE TWIN`, arrow glyph that translates 2px on hover, `fixed bottom-6 right-6 z-50`. Placeholder button in `index.page.html` matches.

Panel: `bg-surface`, `border border-rule`, `rounded-[2px]`, no heavy shadow (a single `0 12px 32px rgb(16 17 19 / 0.08)` at most). Header row: initials in a 2px-radius square (not a circle) with `accent` border, title in `h3`, subtitle in `small` `ink-3`. Messages: assistant on `paper-2`/`surface` with `border border-rule`, user on `bg-ink text-paper`, both `rounded-[2px]`, `small`. Suggested prompts become hairline rows, not pills. Input is an underline field. Send button is a 32px square with `bg-accent`, `text-paper`, `rounded-[2px]`. `overflow-y-contains` is corrected to `overscroll-contain`.

### 6.10 Projects index, project detail, edit

Same tokens and same container. The index heading uses `display` at the smaller end of the clamp, with a `meta` back link. The detail page uses prose at `65ch` with `h2`/`h3` from the scale, tables with `border-rule` hairlines and `accent` header text, and code blocks on `surface` with `border-rule`. `.project-markdown` is rewritten against tokens rather than hardcoded hex.

### 6.11 Admin

Light by default, same tokens. Sidebar 224px, `bg-surface`, `border-r border-rule`. Nav items are `small` sans, `ink-2`, `hover:bg-paper-2`; active is `ink` with a 2px `accent` left border, no filled pill. Headings use `h2`. Tables and forms use the same underline inputs and hairline rules as the public contact form. `layout.html`'s hardcoded `#030f06`, `#060e07`, `#0a2912`, `#0a1a0f`, `#143c1a` are replaced with tokens.

### 6.12 Page loader

Centered, `body` text in `ink-3` with a 1px `rule` progress line and a mono label. No spinner, no colored bar.

## 7. Motion

`FadeInDirective` is rewritten:

- Reads `matchMedia('(prefers-reduced-motion: reduce)')`. When reduced, it never sets `opacity: 0` and never transforms. This also removes the current failure mode where a non-intersecting element stays invisible forever.
- Otherwise sets `opacity: 0` and `translateY(var(--reveal-distance))` in the same frame as mount, transitions with `--dur-reveal` and `--ease-out`, and unobserves after the first intersection.
- Stagger comes from a `--reveal-delay` custom property set per child by the parent template (`style="--reveal-delay: 60ms"`), capped at 5 children so nothing waits longer than 300ms.
- Inline transition strings are replaced by a `.reveal` class in `styles.css` so the directive only toggles a `data-visible` attribute.

Motivation for every animation: fade and rise communicate reading order and mark a section boundary. Nothing else animates automatically. Hover transitions (150ms) exist only on links, rows, and the portrait.

No `window` scroll listeners, no parallax, no marquees, no scroll hijacking.

## 8. Accessibility

- Skip link to `#main`.
- Contact fields gain real labels; `placeholder-as-label` is removed. New i18n keys in section 9.
- `aria-expanded` on the About toggle, `aria-pressed` on profile switcher buttons, `aria-current="page"` where applicable.
- Focus ring: 2px `accent` at 2px offset, visible on every interactive element including rows.
- Portrait `alt` stays descriptive.
- Reduced motion honored for reveals.
- Every text/background pair meets 4.5:1 except `meta` labels at 4.9:1 which pass at their size, and decorative rules which are not text.
- Hit targets: all buttons at least 40px tall on mobile.

## 9. Copy and i18n additions

Add to `SiteCopy` and both `de.ts` / `en.ts`:

- `focus.title`: `Schwerpunkt` / `What I do`
- `stack.eyebrow`: `Technisches Arsenal` / `Toolset`
- `projects.unavailable`: short honest line for the empty state
- `contact.nameLabel`, `contact.emailLabel`, `contact.messageLabel`
- `contact.sendLabel` (replaces the hardcoded `'Sending...'` in the template)
- `chat.launcherLabel`: `ASK THE TWIN` / `FRAG DEN TWIN`
- `footer.copyright`: parameterized on year

`skills.title` and `about.adaptiveTitle` are reused unchanged. No other copy is invented.

## 10. File inventory

New:

- `src/app/pages/components/masthead/` (`masthead.ts`, `masthead.html`)
- `src/app/pages/components/focus/` (`focus.ts`, `focus.html`)

Rewritten or heavily restyled:

- `src/styles.css`
- `src/index.html` (theme-color, no font links)
- `src/app/pages/index.page.html`
- `src/app/pages/components/intro/*` and `hero/*` (deleted after migration)
- `src/app/pages/components/skills-bento/*`
- `src/app/pages/components/about/*`
- `src/app/pages/components/projects/projects-list.html`, `projects-section.html`
- `src/app/pages/components/contact/*`
- `src/app/pages/components/footer/*`
- `src/app/shared/components/site-toolbar/*`
- `src/app/ai-engine/chat/chat-widget.html`
- `src/app/shared/components/form-field/*`, `status-alert/*`, `page-loader/*`
- `src/app/pages/projects/index.page.html`, `projects/[slug]/index.page.html`, `edit.page.html`
- `src/app/pages/admin/(dashboard)/layout/layout.html` and the four admin pages
- `src/app/shared/directives/fade-in.directive.ts`
- `src/app/shared/i18n/site-copy.types.ts`, `de.ts`, `en.ts`

Dependencies added: `@fontsource-variable/instrument-sans`, `@fontsource-variable/jetbrains-mono`.

## 11. Phases

1. Tokens, base layer, fonts, `index.html`, `fade-in.directive.ts`, masthead, focus.
2. Stack, about, page loader.
3. Projects section and list, contact, form field, status alert, footer.
4. Toolbar, chat widget.
5. Projects index, project detail, edit, admin shell and pages.

Each phase ends with a browser check at 1478px and 390px, and `npm run verify`.

## 12. Verification

For each phase:

- `npm run verify` (lint, typecheck, tests) passes.
- Live page at 1478px: no section uses a heading size outside the scale; every section has a distinct layout family; section gaps are not uniform.
- Live page at 390px: toolbar at or below 56px, no horizontal overflow, no element taller than 1100px before the next section.
- Contrast audit script reports zero failures below 4.5:1 for text under 18px.
- `prefers-reduced-motion: reduce` emulation: all content visible without animation.
- `prefers-color-scheme: dark` emulation: all surfaces and text use the dark token set, no element retains a light background.
- Grep for `#[0-9a-f]{6}` in `src/app/**/*.html` returns zero hits outside inline SVG brand marks.

## 13. Risks

- **Icon removal touches the data model's visual surface.** `iconPath` stays in the profile, so admin forms keep working; only rendering stops. If icon data is later edited, nothing is lost.
- **Font weight axis.** Instrument Sans Variable ships 400-700. Weight 450/550 in CSS is fine but does not snap to a separate face; keep to 400, 500, 600, 700.
- **Dark mode without a toggle** means a user with a system dark preference cannot see the light design. Accepted for now; a toggle is a follow-up if wanted.
- **The projects section is empty in production data.** The redesign makes the empty state deliberate, but the page still lacks proof of work. This is a content task, tracked separately from this spec.
- **SSR and `fadeIn`.** Styling `opacity: 0` must happen in the browser only, which the current directive already guards with `isPlatformBrowser`. The rewrite must preserve that guard or the prerendered page will be invisible without JS.
