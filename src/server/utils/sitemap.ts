import { absoluteUrl, resolveSiteLocation, type SiteLocation } from '../utils/site-url';

/**
 * A sitemap entry before it becomes XML.
 *
 * Kept as data so the XML shape and the escaping can be tested without a
 * database, and so a second consumer (an agent-readable index, say) can reuse
 * the same list.
 */
export type SitemapEntry = {
  path: string;
  lastModified?: Date | string | null;
  changeFrequency?: 'daily' | 'weekly' | 'monthly';
  priority?: number;
};

export type SitemapProject = {
  slug: string;
  updatedAt: Date | string;
};

/** Escape the five characters that are illegal in XML text and attribute values. */
export function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** W3C datetime (date only): what `lastmod` expects. */
export function toW3CDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/**
 * The site's indexable pages. Project detail pages come from the database, so a
 * newly published project appears in the sitemap without anyone editing a file.
 *
 * The previous version was a static file, and it had already drifted: two of
 * the eight published projects were missing, including the newest.
 */
export function buildSitemapEntries(projects: readonly SitemapProject[]): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/projects', changeFrequency: 'weekly', priority: 0.8 },
  ];

  for (const project of projects) {
    if (!project.slug || !project.slug.trim()) continue;
    entries.push({
      path: `/projects/${encodeURIComponent(project.slug)}`,
      lastModified: project.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  return entries;
}

export function renderSitemapXml(entries: readonly SitemapEntry[], location: SiteLocation = resolveSiteLocation()): string {
  const urls = entries.map((entry) => {
    const lines = [`    <loc>${escapeXml(absoluteUrl(entry.path, location))}</loc>`];

    const lastmod = toW3CDate(entry.lastModified);
    if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
    if (entry.changeFrequency) lines.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
    if (typeof entry.priority === 'number') lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);

    return `  <url>\n${lines.join('\n')}\n  </url>`;
  });

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n');
}
