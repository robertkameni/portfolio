import { getHeader, getQuery, type H3Event } from 'h3';
import { normalizeAppLocale, type AppLocale } from '../../app/shared/i18n/app-locale';

function normalizeLanguageTag(language: string): string {
  return language.trim().toLowerCase();
}

export function resolveRequestLocale(event: H3Event): AppLocale {
  const queryLocale = getQuery(event)['locale'];
  if (typeof queryLocale === 'string' && queryLocale.trim().length > 0) {
    return normalizeAppLocale(queryLocale);
  }

  const acceptLanguage = getHeader(event, 'accept-language') ?? '';
  const languages = acceptLanguage
    .split(',')
    .map((part) => normalizeLanguageTag(part.split(';')[0] ?? ''))
    .filter(Boolean);

  if (languages.length > 0) {
    return normalizeAppLocale(languages[0]);
  }

  return 'en';
}
