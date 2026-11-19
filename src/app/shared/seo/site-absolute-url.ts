const DEFAULT_ORIGIN = 'https://cv.lucastar.de';

/** Browser-safe canonical base; mirrors server default origin (no env injection in the client). */
export function siteAbsoluteUrl(path: string, origin = DEFAULT_ORIGIN): string {
  if (!path || path === '/') return `${origin}/`;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${suffix}`;
}
