export type AppLocale = 'de' | 'en';

export function normalizeAppLocale(value: string | null | undefined): AppLocale {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized === 'de' || normalized.startsWith('de-') ? 'de' : 'en';
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
