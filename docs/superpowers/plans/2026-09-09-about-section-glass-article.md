# About Section Glass Article Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the About section into a glass article: small portrait + title header, two-column scannable bio inside one frosted panel, highlights below.

**Architecture:** Template-first change in `about.html`, plus a small reusable `.about-glass` utility in `src/styles.css` for blur, border, inset highlight, and `prefers-reduced-transparency` fallback. No changes to adaptive logic in `about.ts`, data interfaces, or i18n copy.

**Tech Stack:** Angular standalone component, Tailwind v4 utilities, existing CSS theme tokens (`--color-primary`, `--color-background`, `--color-surface`).

## Global Constraints

- Preserve brand: dark background, primary `#22c55e`, soft radii already used on site (`rounded-xl` / `rounded-lg`).
- Preserve `trackBehavior="about_viewed"`, adaptive title/paragraphs, show more / less, highlights loop.
- Do not rewrite About copy or change visitor logic in `about.ts`.
- Portrait is supporting (~80–112px), never a full side column.
- Bio body is two columns from `md` up; one column below `md`.
- Glass must degrade to opaque fill when `prefers-reduced-transparency: reduce`.
- Use CSS multi-column (`columns`) for the bio so reading order is top-to-bottom per column (implements the spec’s two-column body intent without a TS paragraph split).

## File Map

| File | Responsibility |
|------|----------------|
| `src/app/pages/components/about/about.html` | New glass article markup and layout classes |
| `src/styles.css` | `.about-glass` component utility + reduced-transparency fallback |
| `src/app/pages/components/about/about.ts` | Unchanged unless build fails for styleUrls (do not add logic) |

---

### Task 1: Add `.about-glass` utility

**Files:**
- Modify: `src/styles.css` (inside `@layer components`)

**Interfaces:**
- Consumes: theme tokens `--color-primary`, `--color-surface`, `--color-background`
- Produces: class `about-glass` usable on the About panel wrapper

- [ ] **Step 1: Add the glass utility after `.link-color-primary-hover`**

```css
  .about-glass {
    border: 1px solid rgba(34, 197, 94, 0.22);
    border-radius: 0.75rem;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(34, 197, 94, 0.04)),
      rgba(5, 20, 8, 0.55);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 18px 50px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
  }

  @media (prefers-reduced-transparency: reduce) {
    .about-glass {
      background: var(--color-surface);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/styles.css
git commit -m "style: add about-glass panel utility with transparency fallback"
```

---

### Task 2: Rebuild About template as glass article

**Files:**
- Modify: `src/app/pages/components/about/about.html` (replace entire template)

**Interfaces:**
- Consumes: `adaptiveTitle()`, `visibleParagraphs()`, `hasCollapsedPreview()`, `isExpanded()`, `toggleAbout()`, `copy()`, `data().highlights`
- Produces: glass article DOM structure matching the approved spec

- [ ] **Step 1: Replace `about.html` with this markup**

```html
<section trackBehavior="about_viewed" class="py-10 md:py-16 flex justify-center text-white">
  <div class="max-w-6xl w-full mx-auto px-4">
    <div class="about-glass p-5 sm:p-8 md:p-10">
      <div class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          class="relative size-20 md:size-28 shrink-0 overflow-hidden rounded-full border border-[#143c1a] shadow-[0_0_24px_rgba(34,197,94,0.12)]"
        >
          <img
            src="/assets/lucas-600.jpg"
            srcset="/assets/lucas-400.jpg 400w, /assets/lucas-600.jpg 600w, /assets/lucas-800.jpg 800w"
            width="112"
            height="112"
            alt="Robert Kameni"
            decoding="async"
            loading="lazy"
            fetchpriority="low"
            sizes="112px"
            class="object-cover object-top w-full h-full grayscale hover:grayscale-0 transition-[filter] duration-500"
          />
        </div>

        <div class="min-w-0 flex flex-col items-baseline">
          <h2 class="text-3xl md:text-5xl font-bold text-primary mb-2 text-balance">{{ adaptiveTitle() }}</h2>
          <div class="h-1 w-16 bg-white"></div>
        </div>
      </div>

      <div class="mb-2 text-gray-300 leading-relaxed text-sm md:text-base text-left md:columns-2 md:gap-10 space-y-4 md:space-y-0">
        @for (paragraph of visibleParagraphs(); track $index) {
        <p class="mb-4 break-inside-avoid">{{ paragraph }}</p>
        }
      </div>

      @if (hasCollapsedPreview()) {
      <div class="mt-2">
        <button
          type="button"
          class="text-primary font-bold hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          (click)="toggleAbout()"
        >
          {{ isExpanded() ? copy().common.showLess : copy().common.showMore }}
        </button>
      </div>
      }
    </div>

    <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left">
      @for (item of data().highlights; track item.title) {
      <div class="flex items-start">
        <div class="bg-[#0a2912] p-2 rounded-full mr-4 shrink-0 mt-1">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="item.iconPath"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-white font-bold text-base">{{ item.title }}</h3>
          <p class="text-gray-400 text-sm mt-1">{{ item.description }}</p>
        </div>
      </div>
      }
    </div>
  </div>
</section>
```

- [ ] **Step 2: Verify bindings still compile**

Run: `npx ng build`
Expected: build succeeds with no template errors on `about`.

- [ ] **Step 3: Manual visual checklist**

Run the app (`npm start` or project’s usual serve) and confirm:

1. No full-height portrait column beside the bio.
2. Glass panel visible over the page’s green washes.
3. Desktop bio uses two columns; mobile is one column.
4. Show more / less still toggles paragraphs.
5. Highlights sit below the glass in two columns on desktop.
6. Adaptive titles still change with visitor mock buttons.

- [ ] **Step 4: Commit**

```bash
git add src/app/pages/components/about/about.html
git commit -m "feat: redesign About as glass article with two-column bio"
```

---

### Task 3: Plan + docs commit (if not already)

**Files:**
- Create: `docs/superpowers/plans/2026-09-09-about-section-glass-article.md` (this file)

- [ ] **Step 1: Ensure this plan is committed on the feature branch**

```bash
git add docs/superpowers/plans/2026-09-09-about-section-glass-article.md
git commit -m "docs: add About glass article implementation plan"
```

## Spec Coverage Self-Review

| Spec requirement | Task |
|------------------|------|
| Glass panel with blur / border / tint | Task 1 |
| Reduced-transparency fallback | Task 1 |
| Small portrait + title header | Task 2 |
| Two-column bio desktop / one mobile | Task 2 |
| Show more / less under body, full width | Task 2 |
| Highlights below glass, 2-col | Task 2 |
| Preserve tracking + adaptive bindings | Task 2 (unchanged bindings) |
| No about.ts / i18n / interface changes | Global constraints |
