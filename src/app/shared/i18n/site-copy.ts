import type { AppLocale } from './app-locale';
import type { SiteCopy } from './site-copy.types';
import { EN_COPY } from './en';
import { DE_COPY } from './de';

const SITE_COPY: Record<AppLocale, SiteCopy> = {
  en: EN_COPY,
  de: DE_COPY,
};

export function getSiteCopy(locale: AppLocale): SiteCopy {
  return SITE_COPY[locale] ?? SITE_COPY['en'];
}
