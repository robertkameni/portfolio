import { siteAbsoluteUrl } from './site-absolute-url';

export type HreflangLink = { lang: 'de' | 'en' | 'x-default'; href: string };

/**
 * Build the three `<link rel="alternate" hreflang>` descriptors for a given
 * site-relative path.
 *
 * Rules enforced here:
 * - Every href carries an explicit `lang=` query so crawlers can reach each
 *   language variant — no fake same-URL pairs allowed.
 * - `x-default` → German (`?lang=de`) because the primary market is DACH.
 * - Paths that already carry a query string (e.g. `?preview=admin`) are not
 *   passed to this helper; callers should use the public canonical path only.
 */
export function buildHreflangLinks(path: string): HreflangLink[] {
  const base = siteAbsoluteUrl(path);
  // siteAbsoluteUrl never appends a query string, so we always use `?` here.
  const deHref = `${base}?lang=de`;
  const enHref = `${base}?lang=en`;

  return [
    { lang: 'de', href: deHref },
    { lang: 'en', href: enHref },
    { lang: 'x-default', href: deHref },
  ];
}
