import { describe, expect, it } from 'vitest';
import { getSiteCopy } from './site-copy';
import type { HeroVariantCopy } from './site-copy.types';

const LOCALES = ['de', 'en'] as const;
const VARIANTS = ['default', 'founder', 'recruiter', 'developer'] as const;

function frontendVariants(locale: (typeof LOCALES)[number]): HeroVariantCopy[] {
  const hero = getSiteCopy(locale).hero;
  return VARIANTS.map((variant) => hero.frontend[variant]);
}

describe('hero copy', () => {
  it.each(LOCALES)('%s: every frontend variant backs its Next.js claim with a bullet', (locale) => {
    // The subtitle advertises "Angular | NextJS | RxJS | TypeScript". A stack the
    // card names but never describes reads as a claim with nothing behind it.
    for (const variant of frontendVariants(locale)) {
      const mentionsNext = variant.items.some((item) => /next\.js/i.test(`${item.title} ${item.description}`));
      expect(mentionsNext, `frontend copy "${variant.description}" has no Next.js bullet`).toBe(true);
    }
  });

  it('gives both locales the same number of bullets per variant', () => {
    // Copy drifting apart between locales is how one language quietly loses a
    // point the other still makes.
    for (const variant of VARIANTS) {
      const de = getSiteCopy('de').hero.frontend[variant].items.length;
      const en = getSiteCopy('en').hero.frontend[variant].items.length;
      expect(de, `frontend.${variant}`).toBe(en);
    }

    for (const variant of VARIANTS) {
      const de = getSiteCopy('de').hero.backend[variant].items.length;
      const en = getSiteCopy('en').hero.backend[variant].items.length;
      expect(de, `backend.${variant}`).toBe(en);
    }
  });

  it('never leaves a bullet without a title or description', () => {
    for (const locale of LOCALES) {
      const hero = getSiteCopy(locale).hero;
      const variants = [...VARIANTS.map((variant) => hero.frontend[variant]), ...VARIANTS.map((variant) => hero.backend[variant])];

      for (const variant of variants) {
        expect(variant.description.trim().length).toBeGreaterThan(0);
        for (const item of variant.items) {
          expect(item.title.trim().length).toBeGreaterThan(0);
          expect(item.description.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});
