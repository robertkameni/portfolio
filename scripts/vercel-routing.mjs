/**
 * Routing patches for the Vercel Build Output API bundle.
 *
 * This project deploys through `.vercel/output/`, and in that mode Vercel takes
 * its routing table from `.vercel/output/config.json`. `vercel.json` still
 * supplies headers, but its `rewrites` did not take effect here: a request for
 * `/portfolio/sitemap.xml` reached the Angular fallback instead of the handler.
 *
 * Kept as a separate module so the route shape can be tested without running the
 * build script.
 */

/** The path the generator is served from inside the Nitro function. */
export const SITEMAP_DESTINATION = '/api/sitemap';

/**
 * Matches the sitemap address with and without the deployment base path.
 * `robots.txt` advertises `/portfolio/sitemap.xml`; the Link headers reference
 * `/sitemap.xml`.
 */
export const SITEMAP_ROUTE_SRC = '/(portfolio/)?sitemap\\.xml';

/**
 * Insert the sitemap route ahead of the filesystem handler and the catch-all.
 *
 * Order matters: both later entries would otherwise win, and `/(.*)` sends
 * everything to the SSR function, which renders the Angular not-found page for
 * this URL.
 *
 * Idempotent, so re-running the build does not accumulate duplicates.
 */
export function ensureSitemapRoute(config) {
  const routes = Array.isArray(config.routes) ? config.routes : [];
  const exists = routes.some((route) => route.src === SITEMAP_ROUTE_SRC);

  if (exists) {
    return { config, inserted: false };
  }

  const route = { src: SITEMAP_ROUTE_SRC, dest: SITEMAP_DESTINATION };

  // Insert before the first `handle` entry (filesystem) if present, otherwise
  // before the catch-all `/(.*)` route.
  const boundaryIndex = routes.findIndex((entry) => entry.handle || entry.src === '/(.*)');
  const insertAt = boundaryIndex === -1 ? routes.length : boundaryIndex;

  config.routes = [...routes.slice(0, insertAt), route, ...routes.slice(insertAt)];

  return { config, inserted: true };
}
