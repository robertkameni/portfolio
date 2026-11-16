// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { normalizeAppLocale, resolveLocaleFromAcceptLanguage, toAngularLocale } from './app-locale';

/**
 * The server picks the page language from `Accept-Language` because it has no
 * `navigator`. Getting this wrong is not cosmetic: the value decides which copy
 * is server-rendered, so a wrong answer changes the text a visitor reads and the
 * text a crawler indexes.
 */
describe('resolveLocaleFromAcceptLanguage', () => {
  it('returns English when the header is absent or empty', () => {
    expect(resolveLocaleFromAcceptLanguage(null)).toBe('en');
    expect(resolveLocaleFromAcceptLanguage(undefined)).toBe('en');
    expect(resolveLocaleFromAcceptLanguage('')).toBe('en');
    expect(resolveLocaleFromAcceptLanguage('   ')).toBe('en');
  });

  it('reads a plain German header', () => {
    expect(resolveLocaleFromAcceptLanguage('de-DE')).toBe('de');
    expect(resolveLocaleFromAcceptLanguage('de')).toBe('de');
    expect(resolveLocaleFromAcceptLanguage('de-AT,de;q=0.9')).toBe('de');
  });

  it('reads a plain English header', () => {
    expect(resolveLocaleFromAcceptLanguage('en-US,en;q=0.9')).toBe('en');
    expect(resolveLocaleFromAcceptLanguage('en-GB')).toBe('en');
  });

  it('honours quality values rather than list order', () => {
    // A header is a weighted list, not an ordered one. The old browser-side
    // helper took the first entry, which is only right when no q-values appear.
    expect(resolveLocaleFromAcceptLanguage('en;q=1,de;q=0.9')).toBe('en');
    expect(resolveLocaleFromAcceptLanguage('en;q=0.5,de;q=0.9')).toBe('de');
  });

  it('ignores languages the app does not ship', () => {
    expect(resolveLocaleFromAcceptLanguage('fr-FR,fr;q=0.9')).toBe('en');
    expect(resolveLocaleFromAcceptLanguage('es-ES,de;q=0.4')).toBe('de');
  });

  it('ignores a language the visitor explicitly refuses', () => {
    // `q=0` means "not acceptable", so German must not win here.
    expect(resolveLocaleFromAcceptLanguage('de;q=0,en;q=0.5')).toBe('en');
  });

  it('does not treat a longer tag as German', () => {
    // A prefix check without the separator would read `den` or `deu` as German.
    expect(resolveLocaleFromAcceptLanguage('deu')).toBe('en');
  });
});

describe('normalizeAppLocale', () => {
  it('keeps German variants and falls back to English', () => {
    expect(normalizeAppLocale('de')).toBe('de');
    expect(normalizeAppLocale('DE-de')).toBe('de');
    expect(normalizeAppLocale('en-US')).toBe('en');
    expect(normalizeAppLocale(null)).toBe('en');
  });
});

describe('toAngularLocale', () => {
  it('maps to the formatting locale Angular pipes expect', () => {
    expect(toAngularLocale('de')).toBe('de-DE');
    expect(toAngularLocale('en')).toBe('en-US');
  });
});
