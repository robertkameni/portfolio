export type AppLocale = 'de' | 'en';

export function normalizeAppLocale(value: string | null | undefined): AppLocale {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized === 'de' || normalized.startsWith('de-') ? 'de' : 'en';
}

/**
 * Picks the locale from an `Accept-Language` header, for the server.
 *
 * The server has no `navigator`, so it used to fall back to `'en'` for every
 * visitor. That meant SSR rendered the English copy of a mostly German page and
 * the browser switched to German after hydration: the language changed under the
 * reader, and a crawler indexed the English text.
 *
 * Quality values are respected (`de;q=0.9, en;q=1` prefers `en`), because a
 * header is a weighted list, not an ordered one. The first supported language
 * wins; anything unsupported falls through to `en`.
 */
export function resolveLocaleFromAcceptLanguage(header: string | null | undefined): AppLocale {
  if (!header?.trim()) {
    return 'en';
  }

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((param) => param.trim()).find((param) => param.startsWith('q='));
      const quality = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag: (tag ?? '').trim(), quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  /**
   * The first language the app actually ships wins.
   *
   * Searching for a German entry anywhere would let `en;q=1, de;q=0.9` resolve to
   * German just because German is present. The header says English is preferred,
   * so the highest-ranked supported tag decides. Tags are matched with the
   * separator (`^de(-|$)`) so `deu` or `den` is not read as German.
   */
  for (const entry of ranked) {
    if (/^de(-|$)/i.test(entry.tag)) return 'de';
    if (/^en(-|$)/i.test(entry.tag)) return 'en';
  }

  return 'en';
}

export function resolveBrowserLocale(): AppLocale {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  // Try to get from localStorage first (user preference)
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('app-locale');
    if (saved === 'de' || saved === 'en') {
      return saved;
    }
  }

  // Fall back to browser language
  const [primaryLanguage] = navigator.languages?.length ? navigator.languages : [navigator.language];
  return normalizeAppLocale(primaryLanguage);
}

export function toAngularLocale(locale: AppLocale): string {
  return locale === 'de' ? 'de-DE' : 'en-US';
}
