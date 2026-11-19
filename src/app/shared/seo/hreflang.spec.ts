import { describe, expect, it } from 'vitest';
import { buildHreflangLinks } from './hreflang';

describe('buildHreflangLinks', () => {
  it('returns exactly three entries — de, en, x-default', () => {
    const links = buildHreflangLinks('/cv');
    expect(links).toHaveLength(3);
    expect(links.map((l) => l.lang)).toEqual(['de', 'en', 'x-default']);
  });

  it('every href contains the lang query param', () => {
    const links = buildHreflangLinks('/cv');
    for (const { href } of links) {
      expect(href).toMatch(/[?&]lang=(de|en)/);
    }
  });

  it('de entry contains lang=de', () => {
    const links = buildHreflangLinks('/cv');
    const de = links.find((l) => l.lang === 'de');
    expect(de?.href).toContain('lang=de');
  });

  it('en entry contains lang=en', () => {
    const links = buildHreflangLinks('/cv');
    const en = links.find((l) => l.lang === 'en');
    expect(en?.href).toContain('lang=en');
  });

  it('x-default points to German (DACH default)', () => {
    const links = buildHreflangLinks('/cv');
    const xd = links.find((l) => l.lang === 'x-default');
    expect(xd?.href).toContain('lang=de');
  });

  it('no fake same-URL pairs — de and en hrefs are distinct', () => {
    const links = buildHreflangLinks('/cv');
    const de = links.find((l) => l.lang === 'de')?.href;
    const en = links.find((l) => l.lang === 'en')?.href;
    expect(de).not.toBe(en);
  });

  it('root path produces exactly one ? per href', () => {
    const links = buildHreflangLinks('/');
    for (const { href } of links) {
      expect((href.match(/\?/g) ?? []).length).toBe(1);
    }
  });

  it('nested path produces hrefs with correct base', () => {
    const links = buildHreflangLinks('/projects/my-slug');
    for (const { href } of links) {
      expect(href).toContain('https://cv.lucastar.de/projects/my-slug');
    }
  });

  it('works for the projects list path', () => {
    const links = buildHreflangLinks('/projects');
    const de = links.find((l) => l.lang === 'de');
    expect(de?.href).toBe('https://cv.lucastar.de/projects?lang=de');
  });
});
