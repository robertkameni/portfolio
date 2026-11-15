# Stylesheet Architecture: Where a Rule Belongs

**Date:** 2026-11-15
**Status:** Implemented
**Scope:** `src/styles.css`, `src/styles/*.css`, component stylesheets, `src/design-system.spec.ts`

## 1. What lives where

The stylesheet is one entry file plus nine owned files. The entry is import-only,
apart from tokens, and `src/design-system.spec.ts` fails the build if a rule ever
appears in it.

| File | Owns | Layer |
| --- | --- | --- |
| `src/styles.css` | Import list, `@theme static`, light/dark/print `:root`, the desktop `--gutter` override | — |
| `src/styles/base.css` | `html`, `body`, `::selection`, heading and paragraph defaults, `scroll-padding-top` | `@layer base` |
| `src/styles/primitives.css` | `.page-shell`, `.bleed`, the `.type-*` scale, `.section`, `.link-quiet`, `.tap-area` | `@layer components` |
| `src/styles/chrome.css` | Toolbar, loader bar, footer lane, skill grid | `@layer components`, with the skill grid and phone nav unlayered |
| `src/styles/forms.css` | `.field` and the `.admin-*` family | `@layer components` |
| `src/styles/overlays.css` | Zoom dialog, chat launcher/panel/bubble | `@layer components` |
| `src/styles/markdown.css` | `.project-markdown`, `.chat-markdown` | `@layer components` |
| `src/styles/motion.css` | Keyframes, entrance and parallax animation, the single reduced-motion block | components rules layered; reduced-motion block unlayered |
| `src/styles/print.css` | The print resets and `@page` | unlayered `@media print` |

Two components own a stylesheet of their own:

| Stylesheet | Component | Why it qualifies |
| --- | --- | --- |
| `src/app/pages/cv/index.page.css` | `CvPage` | Satisfies all four criteria (section 4) |
| `src/app/pages/admin/(dashboard)/messages/messages.page.css` | admin messages view | Satisfies all four criteria; unlayered because its container query must beat `gap-2` on `.btns` |

Ownership is per *decision*, not per line. `motion.css` owns every reduced-motion
reset in the project, including selectors declared in `chrome.css` and
`overlays.css`. A rule's home is the file that owns the decision, and that file
must be able to see every consumer of it.

## 2. Why not component styles for everything

Three structural blockers, each provable from a file in this repo.

**Projected content keeps the parent's scope attribute.** `ng-content` does not
clone the DOM into the child's scope. `form-field.html` projects
`<ng-content select="input, textarea, select">`, so the `.field` class in
`src/styles/forms.css` is applied by the *page* template to an input that renders
inside the child. A `styleUrl` on `form-field` compiles to
`.field[_ngcontent-form-field]`, which never matches. The same applies to
`.toolbar-option`: `src/app/pages/index.page.html:7` projects those anchors into
`site-toolbar.html`, so a toolbar-local stylesheet cannot reach them.

**Sanitized innerHTML carries no scope attribute at all.** `.project-markdown`
(`src/app/pages/projects/[slug]/index.page.html:84`) and `.chat-markdown`
(`src/app/ai-engine/chat/chat-widget.html:90`) are the hosts of `[safeHtml]`
output. The markup is injected through `innerHTML`, so Angular has nothing to
stamp — not a wrong attribute, no attribute. These classes can only be global.

**Unlayered component CSS beats utilities anyway.** Angular prefixes component
selectors with an attribute, which raises specificity above a bare utility. So a
component stylesheet is not a neutral box: it wins against the utilities in the
same template. `messages.page.css` demonstrates the limit case — its container
query sets `gap: 12px` on `.btns`, which must beat the `gap-2` utility that the
template also applies. That is a deliberate override, it is unlayered, and it now
says so in the file. Wrapping it in `@layer components` would silently drop it to
8px.

`::ng-deep` and `:host-context` can force either of the first two cases to work.
Both are rejected here: they punch a permanent hole in encapsulation to save one
file, and the resulting rule still cannot be reasoned about from the stylesheet
it lives in.

## 3. Why not utilities for everything

Utilities are the first choice, not the only one. These have no utility form:

- **Attribute-state selectors.** `.admin-chip[data-live='true']`,
  `.reveal[data-visible='true']`, `.skill-cell[data-span='6']`,
  `[data-toolbar-mobile]`. The state is an attribute written by a binding, not a
  class, so the selector is the whole point.
- **Pseudo-elements.** `.zoom-dialog::backdrop`, `::selection`,
  `.edge-top::before`, `.tap-area::after` (which expands the hit area without
  changing layout).
- **`@page`.** Document-level, and invalid anywhere but the top level.
- **The print scale.** A printed CV is measured in `pt` at fixed sizes, not in a
  fluid `clamp()` on the reader's viewport. `src/app/pages/cv/index.page.css`
  carries a full `@media print` block for this reason.
- **Container queries.** `messages.page.css` responds to the width of
  `.header-container`, not the viewport. A viewport breakpoint would be wrong at
  every width where the admin sidebar is open.
- **Multi-property recipes with tuned values.** `.field` sets border, focus ring,
  invalid state and dark-scheme colour together; reproducing it per input would
  duplicate the tuning into every form.

## 4. The four criteria for scoping

A component `styleUrl` is warranted only when all four hold:

1. **The markup is authored in that component's template** — so the scope
   attribute is actually emitted.
2. **Nothing is projected through `ng-content`** into or out of the styled region.
3. **Nothing is injected as sanitized `innerHTML`.**
4. **No other component uses the class**, including pages that project into a
   shared component.

`CvPage` is the worked example. Its template
(`src/app/pages/cv/index.page.html`) authors every `.cv-*` element itself, has no
`ng-content` and no `[safeHtml]`, and `rg` finds no `.cv-*` usage outside that
page. It therefore moved out of the global entry into
`src/app/pages/cv/index.page.css`, wrapped in `@layer components` so utilities
still override it.

**A layered component stylesheet must also declare the layer order.** Angular
injects component styles into `<head>` at runtime, and in dev that happens
*before* the global Tailwind sheet. The first `@layer` statement in a document
fixes the position of every name in it, so a bare `@layer components { … }`
registers `components` ahead of `theme` and `base` — and preflight
(`* { padding: 0 }`, `h1 { font-size: inherit }`) then beats every rule in the
component. The symptom is a CV sheet with no padding, no border and 16px type,
while `max-width` and `background` still apply because preflight does not touch
them. `index.page.css` therefore opens with:

```css
@layer theme, base, components, utilities;
```

An unlayered component stylesheet (the admin messages view) does not need this,
because unlayered rules outrank every layer regardless of order.

The CV also shows the boundary of the rule. `main#main` in its old print block was
*not* a `.cv-*` rule: it is a document-level reset that applies to every printed
page. It stayed in `src/styles/print.css`. Scoping it would have been a silent
regression on `/projects` and `/admin`. **Sharing a file with a component is not
the same as being owned by it.**

`.cv` — the toolbar nav link, styled in `src/styles/chrome.css` — is the inverse
trap: the name looks like the CV page, but the element is projected into
`site-toolbar` and must stay global.

## 5. Enforcement

`src/design-system.spec.ts` is the executable half of this document. It asserts:

- every file in `src/styles/` is imported by `src/styles.css`;
- the entry contains no rules of its own, only imports and tokens;
- the light, dark and print palettes declare the same token set;
- token overrides come after the base tokens they override (`@import` inlines
  before the entry's own rules, so a token definition placed in an imported file
  is dead — this is a cascade change, not a move);
- exactly one top-level `:root` and one `@media (prefers-reduced-motion: reduce)`
  block;
- the `.cv-*` rules live in the component stylesheet, the component declares
  `styleUrl`, `@page` stays global, and the component pins the layer order.

## 6. Known deviations

- `messages.page.css` is unlayered and must stay that way while it overrides
  `gap-2`. The file carries a comment saying so.
- `.chat-reveal` (`overlays.css`) and `.chat-markdown` (`markdown.css`) both set
  `font-size` and `line-height`. An element carrying both resolves to the later
  import; the equality is maintained by hand.
- `.chat-bubble` and `.chat-panel` animate with keyframes defined in
  `motion.css`. Keyframe names are global, so the dependency is order-independent
  but invisible from `overlays.css`.
