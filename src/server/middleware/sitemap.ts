import { defineEventHandler, getRequestURL, send, setResponseHeader } from 'h3';
import { projectRepository } from '../db/repositories/project.repository';
import { buildSitemapEntries, renderSitemapXml } from '../utils/sitemap';

/**
 * Serves `/sitemap.xml`, whatever the base path is.
 *
 * A middleware rather than a route: the Angular catch-all page answers every
 * unmatched path of the SSR function, so both a Nitro route under
 * `src/server/routes` and a `vercel.json` rewrite ended up rendering the HTML
 * not-found page. Middleware runs before the router, so it cannot be swallowed.
 *
 * Generated from the database: the previous static file had drifted and was
 * missing two of eight published projects, including the newest one.
 *
 * It responds with `send()` rather than by returning the body. A middleware's
 * return value ends the handler chain but does not reliably flush a body in the
 * dev server: the request stayed open with no bytes and no headers until the
 * client gave up, while the query and the XML build had both finished. Writing
 * the response explicitly is the middleware contract, and it behaves the same
 * in dev and in the Vercel build.
 */
export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event);
  if (!pathname.endsWith('/sitemap.xml')) {
    return;
  }

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8');

  try {
    const projects = await projectRepository.findAllPublished();
    const xml = renderSitemapXml(buildSitemapEntries(projects));

    // Short cache: a newly published project becomes discoverable within
    // minutes rather than at the next deploy.
    setResponseHeader(event, 'cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    return send(event, xml);
  } catch (error) {
    console.error('[sitemap] could not list projects', error);

    // An empty but valid sitemap would tell crawlers the site has no project
    // pages, which is the failure this handler exists to prevent.
    setResponseHeader(event, 'cache-control', 'no-store');
    setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8');
    event.node.res.statusCode = 503;
    return send(event, 'Sitemap temporarily unavailable.');
  }
});
