// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildSitemapEntries, escapeXml, renderSitemapXml, toW3CDate } from './sitemap';
import { absoluteUrl, resolveSiteLocation, type SiteLocation } from './site-url';

type VercelRoute = { src?: string; dest?: string; handle?: string; headers?: Record<string, string> };

type RoutingModule = {
  SITEMAP_DESTINATION: string;
  SITEMAP_ROUTE_SRC: string;
  ensureSitemapRoute: (config: { routes?: VercelRoute[] }) => {
    config: { routes: VercelRoute[] };
    inserted: boolean;
  };
};

/* The build script is plain ESM under scripts/, so it is loaded at runtime
   rather than resolved by the TypeScript program. */
const routing = (await import(fileURLToPath(new URL('../../../scripts/vercel-routing.mjs', import.meta.url)))) as RoutingModule;

const LOCATION: SiteLocation = { origin: 'https://example.test', basePath: '/portfolio' };

describe('sitemap entries', () => {
  it('lists the home page and the projects index even with no projects', () => {
    const entries = buildSitemapEntries([]);

    expect(entries.map((entry) => entry.path)).toEqual(['/', '/projects']);
  });

  it('adds one entry per published project', () => {
    const entries = buildSitemapEntries([
      { slug: 'atlas-bio', updatedAt: '2026-10-20T10:00:00.000Z' },
      { slug: 'the-engineering-forge', updatedAt: '2026-06-01T10:00:00.000Z' },
    ]);

    const paths = entries.map((entry) => entry.path);

    // This is the regression that started it: the static file was missing the
    // two newest projects, so those pages were never advertised.
    expect(paths).toContain('/projects/atlas-bio');
    expect(paths).toContain('/projects/the-engineering-forge');
    expect(paths).toHaveLength(4);
  });

  it('keeps the home page first and the most important priority', () => {
    const entries = buildSitemapEntries([{ slug: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }]);

    expect(entries[0]).toMatchObject({ path: '/', priority: 1 });
    expect(entries.at(-1)?.priority).toBeLessThan(1 as number);
  });

  it('skips a project with an empty slug instead of emitting a broken URL', () => {
    const entries = buildSitemapEntries([{ slug: '   ', updatedAt: '2026-01-01T00:00:00.000Z' }]);

    expect(entries).toHaveLength(2);
  });

  it('escapes a slug that would otherwise break the URL', () => {
    const entries = buildSitemapEntries([{ slug: 'a b/c', updatedAt: '2026-01-01T00:00:00.000Z' }]);

    expect(entries[2]?.path).toBe('/projects/a%20b%2Fc');
  });
});

describe('sitemap XML', () => {
  it('starts with the XML declaration and a urlset root', () => {
    const xml = renderSitemapXml(buildSitemapEntries([]), LOCATION);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  });

  it('writes absolute URLs that include the base path', () => {
    const xml = renderSitemapXml([{ path: '/projects' }], LOCATION);

    expect(xml).toContain('<loc>https://example.test/portfolio/projects</loc>');
  });

  it('emits lastmod as a W3C date', () => {
    const xml = renderSitemapXml([{ path: '/x', lastModified: '2026-10-20T10:00:00.000Z' }], LOCATION);

    expect(xml).toContain('<lastmod>2026-10-20</lastmod>');
  });

  it('omits lastmod rather than writing an invalid date', () => {
    const xml = renderSitemapXml([{ path: '/x', lastModified: 'not-a-date' }], LOCATION);

    expect(xml).not.toContain('<lastmod>');
  });

  it('formats priority with one decimal, which the schema expects', () => {
    const xml = renderSitemapXml([{ path: '/x', priority: 0.6 }], LOCATION);

    expect(xml).toContain('<priority>0.6</priority>');
  });
});

describe('XML escaping', () => {
  it('escapes every character that would break the document', () => {
    expect(escapeXml('a&b<c>d"e\'f')).toBe('a&amp;b&lt;c&gt;d&quot;e&apos;f');
  });

  it('escapes an ampersand in a URL exactly once', () => {
    const xml = renderSitemapXml([{ path: '/x?a=1&b=2' }], LOCATION);

    // A double-escaped ampersand is still valid XML but produces a wrong URL.
    expect(xml).toContain('a=1&amp;b=2');
    expect(xml).not.toContain('&amp;amp;');
  });
});

describe('site location', () => {
  it('defaults to the production origin and base path', () => {
    expect(resolveSiteLocation({})).toEqual({ origin: 'https://lucastar.de', basePath: '/portfolio' });
  });

  it('honours overrides and normalises slashes', () => {
    const location = resolveSiteLocation({ SITE_ORIGIN: 'https://preview.test/', SITE_BASE_PATH: 'app/' });

    expect(location).toEqual({ origin: 'https://preview.test', basePath: '/app' });
  });

  it('allows serving at the domain root', () => {
    expect(resolveSiteLocation({ SITE_BASE_PATH: '' }).basePath).toBe('');
    expect(absoluteUrl('/', { origin: 'https://x.test', basePath: '' })).toBe('https://x.test/');
  });

  it('joins a path with and without a leading slash identically', () => {
    expect(absoluteUrl('/projects', LOCATION)).toBe(absoluteUrl('projects', LOCATION));
  });
});

describe('toW3CDate', () => {
  it('returns null for missing input', () => {
    expect(toW3CDate(null)).toBeNull();
    expect(toW3CDate(undefined)).toBeNull();
  });

  it('accepts a Date as well as a string', () => {
    expect(toW3CDate(new Date('2026-03-04T00:00:00.000Z'))).toBe('2026-03-04');
  });
});

describe('vercel build output routing', () => {
  const { SITEMAP_DESTINATION, SITEMAP_ROUTE_SRC, ensureSitemapRoute } = routing;

  const buildOutputRoutes = [
    { src: '/admin/(.*)', headers: { 'x-analog-no-ssr': '1' } },
    { src: '/projects/(.*)/edit', headers: { 'x-analog-no-ssr': '1' } },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/__fallback' },
  ];

  it('inserts the sitemap route ahead of the filesystem handler', () => {
    const { config } = ensureSitemapRoute({ routes: [...buildOutputRoutes] });
    const index = config.routes.findIndex((route) => route.src === SITEMAP_ROUTE_SRC);
    const filesystemIndex = config.routes.findIndex((route) => route.handle === 'filesystem');

    // Both later entries would win: filesystem serves files, and /(.*) sends
    // everything else to the SSR function, which renders the Angular 404.
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(filesystemIndex);
  });

  it('routes both the base-path and the bare sitemap address', () => {
    const pattern = new RegExp(`^${SITEMAP_ROUTE_SRC}$`);

    expect(pattern.test('/sitemap.xml')).toBe(true);
    expect(pattern.test('/portfolio/sitemap.xml')).toBe(true);
    expect(pattern.test('/portfolio/projects')).toBe(false);
  });

  it('points at the handler that is actually reachable', () => {
    const { config } = ensureSitemapRoute({ routes: [...buildOutputRoutes] });
    const route = config.routes.find((entry) => entry.src === SITEMAP_ROUTE_SRC);

    expect(route?.dest).toBe(SITEMAP_DESTINATION);
  });

  it('is idempotent, so rebuilding does not stack duplicates', () => {
    const first = ensureSitemapRoute({ routes: [...buildOutputRoutes] });
    const second = ensureSitemapRoute(first.config);

    expect(first.inserted).toBe(true);
    expect(second.inserted).toBe(false);
    expect(second.config.routes.filter((route) => route.src === SITEMAP_ROUTE_SRC)).toHaveLength(1);
  });

  it('still inserts when the table has no filesystem handler', () => {
    const { config } = ensureSitemapRoute({ routes: [{ src: '/(.*)', dest: '/__fallback' }] });

    expect(config.routes[0]?.src).toBe(SITEMAP_ROUTE_SRC);
  });
});
