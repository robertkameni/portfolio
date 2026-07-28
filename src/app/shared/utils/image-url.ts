/**
 * Responsive image attributes for project cover images.
 *
 * Note: `/_vercel/image` is not available on the Analog Nitro preset (requests fall
 * through to the SPA shell). Use direct URLs instead.
 */

const RESPONSIVE_WIDTHS = [480, 768, 1200, 1600] as const;
const DEFAULT_QUALITY = 75;
const DEFAULT_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px';

export type ResponsiveImageAttributes = {
  src: string;
  srcset: string;
  sizes: string;
};

/** Same-site absolute URLs (e.g. production /assets/*) → relative path. */
function normalizeImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/assets/')) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Relative or invalid URL — use as-is.
  }

  return url;
}

/** Unsplash supports width via query param — build a real srcset without /_vercel/image. */
function buildUnsplashSrcset(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('images.unsplash.com')) {
      return null;
    }

    return RESPONSIVE_WIDTHS.map((width) => {
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', String(DEFAULT_QUALITY));
      return `${parsed.toString()} ${width}w`;
    }).join(', ');
  } catch {
    return null;
  }
}

export function getResponsiveImageAttrs(url: string, sizes = DEFAULT_SIZES): ResponsiveImageAttributes {
  const src = normalizeImageUrl(url);
  const srcset = buildUnsplashSrcset(src) ?? src;

  return { src, srcset, sizes };
}
