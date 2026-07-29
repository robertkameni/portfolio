/**
 * Responsive image attributes for project cover images.
 *
 * Note: `/_vercel/image` is not available on the Analog Nitro preset (requests fall
 * through to the SPA shell). Use direct URLs instead.
 */

const RESPONSIVE_WIDTHS = [480, 640, 768, 1024] as const;
const DEFAULT_QUALITY = 75;
const DEFAULT_SIZES = '(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 640px';

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
function buildUnsplashSrcset(url: string): { srcset: string; src: string } | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('images.unsplash.com')) {
      return null;
    }

    const srcset = RESPONSIVE_WIDTHS.map((width) => {
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', String(DEFAULT_QUALITY));
      return `${parsed.toString()} ${width}w`;
    }).join(', ');

    const srcWidth = RESPONSIVE_WIDTHS[2] ?? 768;
    parsed.searchParams.set('w', String(srcWidth));
    parsed.searchParams.set('q', String(DEFAULT_QUALITY));

    return { srcset, src: parsed.toString() };
  } catch {
    return null;
  }
}

export function getResponsiveImageAttrs(url: string, sizes = DEFAULT_SIZES): ResponsiveImageAttributes {
  const normalized = normalizeImageUrl(url);
  const unsplash = buildUnsplashSrcset(normalized);

  if (unsplash) {
    return { src: unsplash.src, srcset: unsplash.srcset, sizes };
  }

  return { src: normalized, srcset: normalized, sizes };
}
