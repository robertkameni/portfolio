import type { AppLocale } from './app-locale';

/**
 * Prefer the English project field when the UI locale is EN and the EN value
 * is non-blank. Otherwise keep the German source (including when EN is empty).
 */
export function localizedProjectField(de: string | null | undefined, en: string | null | undefined, locale: AppLocale): string | null {
  if (locale === 'en') {
    const english = en?.trim();
    if (english) {
      return english;
    }
  }
  const german = de?.trim();
  return german ? german : null;
}
