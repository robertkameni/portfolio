/**
 * Where the site claims to live, used for canonical URLs, the sitemap and the
 * Link headers.
 *
 * The deployed site is served under `/portfolio/` (see the `base` tag and the
 * `vercel.json` rewrites), so the origin alone is not enough. Both parts are
 * overridable so a preview or a custom domain does not have to edit code.
 */
export type SiteLocation = {
  origin: string;
  basePath: string;
};

const DEFAULT_ORIGIN = 'https://lucastar.de';
const DEFAULT_BASE_PATH = '/portfolio';

/** Strip trailing slashes so joining never produces `//`. */
function trimSlashes(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

/** Ensure a leading slash and no trailing slash; an empty base stays empty. */
function normalizeBasePath(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function resolveSiteLocation(env: NodeJS.ProcessEnv = process.env): SiteLocation {
  return {
    origin: trimSlashes(env['SITE_ORIGIN'] ?? DEFAULT_ORIGIN),
    basePath: normalizeBasePath(env['SITE_BASE_PATH'] ?? DEFAULT_BASE_PATH),
  };
}

/** Absolute URL for a path inside the site, e.g. `/projects` → `https://host/portfolio/projects`. */
export function absoluteUrl(path: string, location: SiteLocation = resolveSiteLocation()): string {
  if (!path || path === '/') {
    return `${location.origin}${location.basePath}/`;
  }
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${location.origin}${location.basePath}${suffix}`;
}
