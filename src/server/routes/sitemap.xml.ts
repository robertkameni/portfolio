import { defineEventHandler, setResponseHeader } from 'h3';
import { projectRepository } from '../db/repositories/project.repository';
import { buildSitemapEntries, renderSitemapXml } from '../utils/sitemap';

/**
 * `/sitemap.xml` (also reachable as `/portfolio/sitemap.xml` through the
 * vercel.json rewrite).
 *
 * Generated from the database rather than shipped as a static file: the static
 * version had drifted and was missing two of eight published projects,
 * including the newest one. A crawler reading it never learned those pages
 * existed.
 */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8');

  try {
    const projects = await projectRepository.findAllPublished();
    const xml = renderSitemapXml(buildSitemapEntries(projects));

    // Short cache: a newly published project should be discoverable within
    // minutes, not after a redeploy.
    setResponseHeader(event, 'cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    return xml;
  } catch (error) {
    console.error('[sitemap] could not list projects', error);

    // An empty but valid sitemap would quietly tell crawlers the site has no
    // project pages, which is the failure this route exists to prevent.
    setResponseHeader(event, 'cache-control', 'no-store');
    setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8');
    event.node.res.statusCode = 503;
    return 'Sitemap temporarily unavailable.';
  }
});
