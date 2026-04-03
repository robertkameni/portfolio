export type AppLocale = 'de' | 'en';

export function toAngularLocale(locale: AppLocale): string {
  return locale === 'de' ? 'de-DE' : 'en-US';
}

