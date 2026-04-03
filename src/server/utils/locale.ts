import { getHeader, type H3Event } from 'h3';
import type { AppLocale } from '../../app/shared/i18n/app-locale';

function normalizeLanguageTag(language: string): string {
  return language.trim().toLowerCase();
}

export function resolveRequestLocale(event: H3Event): AppLocale {
  const acceptLanguage = getHeader(event, 'accept-language') ?? '';
  const languages = acceptLanguage
    .split(',')
    .map((part) => normalizeLanguageTag(part.split(';')[0] ?? ''))
    .filter(Boolean);

  if (languages.some((language) => language === 'de' || language.startsWith('de-'))) {
    return 'de';
  }

  return 'en';
}

