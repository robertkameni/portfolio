// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildSitemapEntries, escapeXml, renderSitemapXml, toW3CDate } from './sitemap';
import { absoluteUrl, resolveSiteLocation, type SiteLocation } from './site-url';

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

describe('vercel rewrites', () => {
  const config = JSON.parse(readFileSync(fileURLToPath(new URL('../../../vercel.json', import.meta.url)), 'utf8'));
  const rewrites: Array<{ source: string; destination: string }> = config.rewrites ?? [];

  it('routes the advertised sitemap URL to the generator', () => {
    // robots.txt advertises https://lucastar.de/portfolio/sitemap.xml. Without
    // this rewrite the Angular catch-all answers that URL with an HTML 404.
    const match = rewrites.find((rule) => rule.source === '/portfolio/sitemap.xml');

    expect(match?.destination).toBe('/api/sitemap');
  });

  it('also serves the bare /sitemap.xml, which the Link headers reference', () => {
    const match = rewrites.find((rule) => rule.source === '/sitemap.xml');

    expect(match?.destination).toBe('/api/sitemap');
  });

  it('places the sitemap rules before the catch-all rewrite', () => {
    // Rewrites stop at the first match, so ordering is the whole contract.
    const sitemapIndex = rewrites.findIndex((rule) => rule.destination === '/api/sitemap');
    const basePathIndex = rewrites.findIndex((rule) => rule.source === '/portfolio/(.*)');

    expect(sitemapIndex).toBeGreaterThanOrEqual(0);
    expect(sitemapIndex).toBeLessThan(basePathIndex);
  });
});
