# About Section Redesign: Glass Article

**Date:** 2026-09-09  
**Status:** Approved for planning  
**Scope:** `src/app/pages/components/about/` (template + styles only unless motion helpers are required)

## Problem

The current About layout is a classic portrait-left / bio-right split. It fails because:

1. The full-height portrait competes with the text (uneven, awkward side-by-side).
2. Body copy is a hard-to-scan wall of text in a single wide column.
3. The composition reads as a generic portfolio template.

## Goals

- Keep dark background + green primary brand language.
- Keep the bio as a **single readable column** (short copy; two columns are unnecessary).
- Use a **glassmorphism** panel as the primary surface for the bio.
- Demote the portrait to a supporting identity cue (not a layout column).
- Preserve adaptive titles/paragraphs, show more / less, highlights data, and `about_viewed` tracking.

## Non-goals

- Rewriting About copy or i18n content (unless a tiny string is needed for a11y).
- Changing visitor-adaptive logic in `about.ts`.
- Redesigning Hero, Skills, Projects, or Contact.
- Introducing a new design system or icon library.

## Design Read

Redesign (preserve brand) of a developer-portfolio About for recruiters, founders, and developers: dark tech with green accent, glass article composition, dials approximately **variance 6 / motion 4 / density 4**.

## Chosen Approach: Glass Article

### Structure (top → bottom)

1. **Section shell**  
   Full-width section on existing `bg-background`. Slightly increased vertical padding vs today so the glass can breathe.

2. **Glass panel** (single frosted container at site `max-w-6xl`, matching Hero/Skills/Contact width)  
   - Translucent fill with a subtle green tint (brand-locked to primary).  
   - `backdrop-filter: blur(...)` + saturate.  
   - 1px border (`white` / primary at low opacity).  
   - Soft inner top highlight (inset shadow or pseudo).  
   - Soft corner radius consistent with existing soft cards on the site (no new radius system).  
   - **Fallback:** under `prefers-reduced-transparency: reduce`, use an opaque near-black fill (no blur).

3. **Header + bio (left column on desktop)**  
   - Small portrait (circle, ~80–96px) beside the adaptive green title.  
   - Single-column body paragraphs + show more / less.  
   - Never a full-height portrait competing with a text wall.

4. **Highlights (right column on desktop)**  
   - Same `data().highlights` content, stacked like Contact features.  
   - Icon + title + short description; no heavy card chrome.  
   - Lives inside the glass panel so the wide desktop panel stays balanced.

5. **Mobile**  
   - Single column: header, bio, then highlights.

### Motion

- Keep page-level `fadeIn` if already applied from the parent.  
- Optional: light hover on portrait filter (existing).  
- No scroll-hijack, marquee, or new GSAP in this section.  
- Honor `prefers-reduced-motion` for any new transitions.

### Accessibility

- Preserve meaningful `alt` on the portrait.  
- Ensure body and show-more link meet WCAG AA on the glass fill (including reduced-transparency fallback).  
- Focus styles on the expand/collapse control remain visible.  
- Do not rely on blur alone for contrast.

## Implementation Notes

- Prefer Tailwind utilities already used in the project; add a small scoped style block or utility classes only if glass tokens are awkward in pure utilities.  
- Touch primarily `about.html` (and optional component styles). Avoid changing `about.ts` unless layout needs a trivial template helper.  
- Do not change About data interfaces or seed content for this redesign.

## Success Criteria

- No full-height image + text side-by-side layout.  
- Desktop bio reads as one comfortable column inside one glass panel.  
- Portrait is clearly secondary.  
- Expand / collapse and visitor-adaptive titles still work.  
- Glass has a solid fallback when transparency is reduced.  
- Section still matches site brand (dark + green) and does not look like a generic photo/bio template.

## Out of Scope Follow-ups

- Shortening or restructuring About copy in i18n files.  
- Replacing the birthday-backdrop photo with a cleaner studio shot.  
- Moving highlights into a different page section.
